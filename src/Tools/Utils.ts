import { moment } from "obsidian";
import { RRule } from "rrule";

const  getTime = (timeString : string) =>{
    const time = timeString.match(/⌚(\d{2}:\d{2})/);
    if(time && time[1])
        return time![1];
    else return "";
}
const hasTimeFormat = (t: any) => /⌚(\d{2}:\d{2})/.test(t.text);
const getEarlierTimeTask = (tasks: any) => {
    let earliestTime = getTime(tasks.find((t:any)=>isNotCompletedOrCancelled(t) && getTime(t.text)).text);
    for(let task of tasks.where(isNotCompletedOrCancelled))
        if(getTime(task.text) && earliestTime.localeCompare(getTime(task.text)))
            earliestTime = getTime(task.text);
    return earliestTime;
}

const getEarliestDueDate = (page: any) => {
    if (!page?.file?.tasks) return 0;

    let earliest: number | undefined = undefined;

    for (const task of page.file.tasks.where?.(isNotCompletedOrCancelled) ?? []) {
        if (task.due && (!earliest || moment(task.due.ts).isBefore(moment(earliest)))) {
            earliest = task.due.ts;
        }
    }

    return earliest || 0;
};

const sortDueDates = (a: any, b: any) =>
    getEarliestDueDate(a) - getEarliestDueDate(b);




const sortTimes = (a: any, b:any) => getEarlierTimeTask(a.file.tasks).localeCompare(getEarlierTimeTask(b.file.tasks));
const setPriority = (p:any, t:any) =>{
    const {text} = t;
    const priority = p.priority || 0;
    if(text.includes("🔺") && priority < 3)
        p.priority = 3;
    else if(text.includes("⏫") && priority < 2)
        p.priority = 2;
    else if(text.includes("🔼") && priority < 1)
        p.priority = 1;
    else if(text.includes("🔽") && priority <= 0)
        p.priority = -1;
    else if(text.includes("⏬") && priority === 0)
        p.priority = -2;
    else
        p.priority = 0;
    return true;
}
const isTimeBeforeCurrentTime = (t: any) => {
    const timeSubstring = getTime(t.text);
    if (timeSubstring) {
        return moment(timeSubstring, 'HH:mm').isBefore(moment());
    }
    // If any condition fails, return false
    return false;
}
const taskNotCompleted = (t:any) => !t.completed && !t.fullyCompleted;
const taskNotCancelled = (t:any) => t.status != "-";
const isNotCompletedOrCancelled = (t: any) => taskNotCancelled(t) && taskNotCompleted(t);
const fileNotArchived = (p:any) => !p.Archived && !p['Handled By']?.path;
const isNotArchived = (p:any) => !p.Archived;
const IsDueTime = (p:any) =>
    !!(p.taskFound = p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where(isTodayTask)
        .where(isTimeBeforeCurrentTime)
        .where((t:any) => setPriority(p,t))
        .first());
const isTodayTask = (t: any) => (t.due && moment(t.due.ts).isSame(moment(), 'day') || (t.scheduled && moment(t.scheduled.ts).isSame(moment(), 'day')));
const IsScheduleDayWithoutTime = (p:any) => 
    !!(p.taskFound = p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where((t:any) => !hasTimeFormat(t))
        .where((t:any) => t.scheduled && moment(t.scheduled.ts).isSame(moment(), 'day'))
        .where((t:any) => setPriority(p,t))
        .first());
const IsDueDayWithoutTime = (p:any) => 
    !!(p.taskFound = p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where((t:any) => !hasTimeFormat(t))
        .where((t:any) => t.due && moment(t.due.ts).isSame(moment(), 'day'))
        .where((t:any) => setPriority(p,t))
        .first());
const IsDueDayButNotTime = (p:any) =>
    !!(p.taskFound = p.file.tasks
        .where(isTodayTask)
        .where(isNotCompletedOrCancelled)
        .where((t:any) => hasTimeFormat(t) && !isTimeBeforeCurrentTime(t))
        .first());
const IsNextDue = (p:any) => {
    if (!p.file || !p.file.tasks) return false;
    let found = p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where((t:any) => t.due && !moment(t.due.ts).isSameOrBefore(moment(), 'day') && !t.scheduled && (!t.start || moment(t.start.ts).isSameOrBefore(moment(), 'day')))
        .where((t:any)=>setPriority(p,t))
        .sort((t:any)=>t.due, 'asc')
        .first();
    if (found) {
        p.taskFound = found;
        return true;
    }
    p.taskFound = undefined;
    return false;
}

const IsNextPage = (p:any) => {
    if (!p.file || !p.file.tasks) {
        return false;
    }
    // First clause: start date today or earlier, not scheduled
    let found = p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where((t:any) => t.start && moment(t.start.ts).isSameOrBefore(moment(), 'day') && !t.scheduled)
        .where((t:any)=>setPriority(p,t))
        .first();
    if (found) {
        p.taskFound = found;
        return true;
    }
    // Second clause: no tasks with start/due/scheduled, pick any not completed/cancelled
    const hasAnyDated = p.file.tasks
        .where((t:any) => t.start || t.due || t.scheduled)
        .where(isNotCompletedOrCancelled)
        .length > 0;
    if (!hasAnyDated) {
        found = p.file.tasks.where(isNotCompletedOrCancelled)
            .where((t:any) => setPriority(p,t))
            .first();
        if (found) {
            p.taskFound = found;
            return true;
        }
    }
    p.taskFound = undefined;
    return false;
}


const isLate = (p: any) => 
    !!(p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where(
            (t: any) =>
            (t.due && moment(t.due.ts).isBefore(moment(), 'day')) ||
            (t.scheduled && moment(t.scheduled.ts).isBefore(moment(), 'day'))
        ).first());
const isOpenNoTask = (p: any) => 
    p.file.tasks
        .where(isNotCompletedOrCancelled)
        .length == 0;
const isTaskFailed = (t: any) =>
    isNotCompletedOrCancelled(t) && t.due && (moment(t.due.ts).isBefore(moment(), 'day'))

const fileDueOnly = (p: any) => 
    !!(p.taskFound = p.file.tasks
        .where(isDueOnly)
        .first());

export {getTime, sortTimes, sortDueDates, fileNotArchived, IsDueTime, IsDueDayWithoutTime,IsDueDayButNotTime, IsNextPage, IsNextDue, isNotCompletedOrCancelled, isLate, isOpenNoTask, isNotArchived, isTaskFailed, isTodayTask, isTimeBeforeCurrentTime, hasTimeFormat, IsScheduleDayWithoutTime, fileDueOnly};

const parseTasks = (input: string) =>{
    const calendarRegex = /\[x\] (.*?) ✅ (\d{4}-\d{2}-\d{2}) (.*?) \[\[(.*?)\]\]/g;
    const doneRegex = /\[x\] (.*?) ✅ (\d{4}-\d{2}-\d{2})/g;
    const todoRegex = /\[[ ]\] (.*?)(?=\n|$)/g;
    const result: {task: string, date?: string, link?: string, done?:boolean}[] = [];
    //If the tasks are displayed in calendar
    for(let match of input.matchAll(calendarRegex)){
        result.push({task:match[1],date:match[2],link:match[4]});
    }
    if(result.length > 0) return result;
    for(let match of input.matchAll(doneRegex)){
        result.push({task:match[1],date:match[2], done:true});
    }
    for(let match of input.matchAll(todoRegex)){
        result.push({task:match[1], done:false});
    }
    return result;
}

const parseTasksToCancel = (input: string) => {
    const autoRegex = /^- \[\s\] .+$/gm;
    const recurringRegex = /🔁\s*(.*?)\s*(?=🛫|⏳|📅|$)/;
    const datesRegex = /(🛫|📅|⏳)\s*(\d{4}-\d{2}-\d{2})/g;

    const result: {
        task: string,
        startDate?: string,
        dueDate?: string,
        scheduledDate?: string,
        rrules: { [key: string]: RRule }
    }[] = [];

    for (const match of input.matchAll(autoRegex)) {
        const task = match[0];
        const dates: { [key: string]: string } = {};
        let m;

        while ((m = datesRegex.exec(task)) !== null) {
            if (m[1] === "🛫") dates.startDate = m[2];
            if (m[1] === "📅") dates.dueDate = m[2];
            if (m[1] === "⏳") dates.scheduledDate = m[2];
        }

        const rrules: { [key: string]: RRule } = {};
        const recurMatch = task.match(recurringRegex);
        if (recurMatch && recurMatch[1].trim() !== "") {
            const options = RRule.fromText(recurMatch[1].trim()).origOptions;

            if (dates.startDate) {
                rrules.start = new RRule({
                    ...options,
                    dtstart: moment.utc(dates.startDate, "YYYY-MM-DD").startOf("day").toDate(),
                });
            }

            if (dates.dueDate) {
                rrules.due = new RRule({
                    ...options,
                    dtstart: moment.utc(dates.dueDate, "YYYY-MM-DD").startOf("day").toDate(),
                });
            }
            if (dates.scheduledDate) {
                rrules.scheduled = new RRule({
                    ...options,
                    dtstart: moment.utc(dates.scheduledDate, "YYYY-MM-DD").startOf("day").toDate(),
                });
            }
        }

        result.push({ task, ...dates, rrules });
    }

    return result;
};





const parseTags = (tags :string[]) =>{
    let result = "";
    for(let i in tags){
        result += `#${tags[i]}${(i==(tags.length-1).toString())?"":"|"}`;
    }
    return result
}
const parseClasses = (classes: string) =>{
    const regex = /(- [^\n]+\n(\t- [^\n]+\n)+)/g;
    const matches = classes.match(regex);
    let result: {[key:string]:string[]} = {};
    if (matches) {
        matches.forEach(match => {
            const prop = match.split("\n\t-");
            const propList = [];
            for(let i = 1; i < prop.length; i++)
                propList.push(prop[i].replace("-","").trim());
            result[prop[0].replace("-","").trim()] = propList
        });
    }
    return result;
}
export {parseTasks, parseTasksToCancel, parseTags, parseClasses};

const createProxyForRender = (render: Function) => {
    const obj: {[key: string] : any} = {};
    const handler: ProxyHandler<{ [key: string]: any }> = {
            set(target: { [key: string]: any }, key: string, value: any) {
                target[key] = value;
                render();
                return true;
            }
        }
    return new Proxy(obj, handler);
}

const setState = (state: ProxyConstructor, obj: any) => Object.assign(state, obj);
export {createProxyForRender, setState};

const getRandomTime = (startDate: moment.Moment, endDate: moment.Moment) => {
    const timeDiff = endDate.diff(startDate, 'days');
    const randomTime = Math.floor(Math.random() * timeDiff) + 1;

    return startDate.add(randomTime, 'days');
}

export {getRandomTime};

const createSVGAndLink = (linkDiv:HTMLDivElement, href: string, svg: string, text: string) => {
    const link = linkDiv.createEl('a', { href });
    link.setAttr('style', 'display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;');
    link.innerHTML = `${svg}<br>${text}`;
};
export {createSVGAndLink};

/**
 * This code is inspired from the work of 702573N https://github.com/702573N/Obsidian-Tasks-Calendar
 */
const getFilename = (path: string): string | undefined  => 
    (path.match(/^(?:.*\/)?([^\/]+?|)(?=(?:\.[^\/.]*)?$)/)||[])[1];
const momentToRegex = (momentFormat: string) : string => {
	momentFormat = momentFormat.replaceAll(".", "\\.");
	momentFormat = momentFormat.replaceAll(",", "\\,");
	momentFormat = momentFormat.replaceAll("-", "\\-");
	momentFormat = momentFormat.replaceAll(":", "\\:");
	momentFormat = momentFormat.replaceAll(" ", "\\s");
	
	momentFormat = momentFormat.replace("dddd", "\\w{1,}");
	momentFormat = momentFormat.replace("ddd", "\\w{1,3}");
	momentFormat = momentFormat.replace("dd", "\\w{2}");
	momentFormat = momentFormat.replace("d", "\\d{1}");
	
	momentFormat = momentFormat.replace("YYYY", "\\d{4}");
	momentFormat = momentFormat.replace("YY", "\\d{2}");
	
	momentFormat = momentFormat.replace("MMMM", "\\w{1,}");
	momentFormat = momentFormat.replace("MMM", "\\w{3}");
	momentFormat = momentFormat.replace("MM", "\\d{2}");
	
	momentFormat = momentFormat.replace("DDDD", "\\d{3}");
	momentFormat = momentFormat.replace("DDD", "\\d{1,3}");
	momentFormat = momentFormat.replace("DD", "\\d{2}");
	momentFormat = momentFormat.replace("D", "\\d{1,2}");
	
	momentFormat = momentFormat.replace("ww", "\\d{1,2}");

	return `/^(${momentFormat})$/`;
}

const getMetaFromNote = (task: any, metaName: string, dv: any) => 
    dv.pages(`"${task.link.path}"`)[metaName][0] || "";

const IsRecurringThisDay = (task: any, date: any)=>{
    if(!task.recurringValue)
        return false;
    if(moment(date).isBefore(task.moment, 'day'))
        return false;
    try{
        let rule = new RRule({
            ...RRule.fromText(task.recurringValue).origOptions,
            dtstart: task.moment.clone().set("hour",12).toDate()
        });
        let startOfDay = moment(date).startOf("day").toDate();
        let endOfDay = moment(date).endOf("day").toDate();
        let occurrences = rule.between(startOfDay, endOfDay);
        return occurrences.length > 0;
    }catch(e){
        return false;
    }
    
}


const isDueOrScheduled = (task: any) =>
    isNotCompletedOrCancelled(task) && (task.due || task.scheduled);
const isDueOnly = (task: any) =>
    isNotCompletedOrCancelled(task) && task.due && !task.scheduled;
const isTime = (task: any) =>
    isNotCompletedOrCancelled(task) && hasTimeFormat(task) && isDueOrScheduled(task);

const isTimePassed = (task: any) =>
    isNotCompletedOrCancelled(task) && isTodayTask(task) && isTimeBeforeCurrentTime(task);

const sortTasks = (a: any, b: any, date: any) =>{
    if(a.type == "time" && b.type != "timePassed" && b.type != "time" && !moment(date).isSame(moment(), 'day')){
        return 2 - b.typePriority;
    }
    if(b.type == "time" && a.type != "timePassed" && a.type != "time" && !moment(date).isSame(moment(), 'day')){
        return a.typePriority - 2;
    }
    if(a.typePriority != b.typePriority && !(((a.type == "timePassed" && b.type == "time") || (b.type == "timePassed" && a.type == "time")) && !moment(date).isSame(moment(), 'day'))){
        return a.typePriority - b.typePriority;
    }
    if(a.type == "time" || a.type == "timePassed"){
        return a.moment.diff(b.moment);
    }
    return a.priority - b.priority;
}

const sortDue = (a: any, b: any) => {
    return moment(a.due.ts).diff(moment(b.due.ts));
}
export {getFilename, momentToRegex, getMetaFromNote, IsRecurringThisDay, isDueOrScheduled, isDueOnly, isTime, isTimePassed, sortTasks, sortDue};

/** POSVaultFunctions tools */

const calculatePagePoints = (page: any) =>{
    const calculateTaskPoints = (task: any, pageMulti: number) =>
        10 * (task['✳️'] !== undefined ? task['✳️'] : 1) * pageMulti;
    // Only default to 1 if page['✳️'] is undefined
    const pageMulti = page['✳️'] !== undefined ? page['✳️'] : 1;
    return page.file.tasks
        .where((t: any) => t.completed && t.fullyCompleted)
        .values.reduce(
            (acc: number, task: any) => acc + calculateTaskPoints(task, pageMulti), 0
        );
}

const calculateTotalPoints = (dv: any) => 
    dv.pages().values.reduce(
            (acc: number, page: any) => acc + calculatePagePoints(page), 0
        )

const currentLevelBasedOnXp = (totalXp: number, x: number, y: number) => {
    let level = 0;
    let xpNeeded = 0;
    
    while (xpNeeded <= totalXp) {
        level++;
        xpNeeded += Math.pow(x * level, y);
    }
    
    // Subtract 1 because it increments level one time too many in the loop
    return level - 1;
}
        
const xpForNextLevel = (currentLevel: number, x: number, y: number) =>
    Math.pow(x * (currentLevel + 1), y)


        
const totalXpToTargetLevel = (targetLevel: number, x: number, y: number) => {
    let totalXp = 0;
    for (let level = 1; level <= targetLevel; level++) {
        totalXp += Math.pow(x * level, y);
    }
    return totalXp;
}
export {calculatePagePoints, calculateTotalPoints, currentLevelBasedOnXp, xpForNextLevel, totalXpToTargetLevel};





