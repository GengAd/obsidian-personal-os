import { moment } from "obsidian";

const getTime = (timeString : string) =>{
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
const sortTimes = (a: any, b:any) => getEarlierTimeTask(a.file.tasks).localeCompare(getEarlierTimeTask(b.file.tasks));
const setPriority = (p:any, t:any) =>{
    const {text} = t;
    const priority = p.priority || 0;
    if(text.includes("🔺") && priority < 4)
        p.priority = 4;
    else if(text.includes("⏫") && priority < 3)
        p.priority = 3;
    else if(text.includes("🔼") && priority < 2)
        p.priority = 2;
    else if(text.includes("🔽") && priority < 1)
        p.priority = 1;
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
    p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where(IsTodayTask)
        .where(isTimeBeforeCurrentTime)
        .where((t:any) => setPriority(p,t))
        .length >0;
const IsTodayTask = (t: any) => (t.due && moment(t.due.ts).isSame(moment(), 'day') || (t.scheduled && moment(t.scheduled.ts).isSame(moment(), 'day')));
const IsDueDayWithoutTime = (p:any) =>
    p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where((t:any) => !hasTimeFormat(t))
        .where(IsTodayTask)
        .where((t:any) => setPriority(p,t))
        .length > 0;
const IsDueDayButNotTime = (p:any) =>
        p.file.tasks
          .where(IsTodayTask)
          .where(isNotCompletedOrCancelled)
          .where((t:any) => hasTimeFormat(t) && !isTimeBeforeCurrentTime(t))
          .length > 0;
const IsNextPage = (p:any) =>
        ((p.file.tasks
          .where(isNotCompletedOrCancelled)
          .where((t:any) => t.start && moment(t.start.ts).isSameOrBefore(moment(), 'day') && !t.scheduled)
          .where((t:any)=>setPriority(p,t)))
          .length > 0
          ||
        (p.file.tasks
          .where((t:any) => t.start || t.due || t.scheduled || t.text.contains('[[Someday]]')||t.text.contains('#Someday'))
          .where(isNotCompletedOrCancelled)
          .length == 0 
            &&
          p.file.tasks.where(isNotCompletedOrCancelled)
          .where((t:any) => setPriority(p,t))
          .length>0))
const isLate = (p: any) => 
    p.file.tasks
        .where(isNotCompletedOrCancelled)
        .where(
            (t: any) =>
            (t.due && moment(t.due.ts).isBefore(moment(), 'day')) ||
            (t.scheduled && moment(t.scheduled.ts).isBefore(moment(), 'day'))
        ).length > 0;
const isOpenNoTask = (p: any) => 
    p.file.tasks
        .where(isNotCompletedOrCancelled)
        .length == 0;
const isTaskFailed = (t: any) =>
    isNotCompletedOrCancelled(t) && t.due && (moment(t.due.ts).isBefore(moment(), 'day'))
export {sortTimes, fileNotArchived, IsDueTime, IsDueDayWithoutTime,IsDueDayButNotTime, IsNextPage, isNotCompletedOrCancelled, isLate, isOpenNoTask, isNotArchived, isTaskFailed};

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

const parseTasksToCancel = (input: string) =>{
    const autoRegex = /- \[[ ]\] (.*?)(?=\n|$)/g;
    const reccuringRegex = /🔁 every (\d*\s)?(day|weekday|week|month|year)( on)?/;
    const datesRegex = /(🛫|📅|⏳)\s*(\d{4}-\d{2}-\d{2})/g;
    const result: {task: string, startDate?: string, dueDate?:string, scheduledDate?:string, reccuringType:string, reccuringNumber: number}[] = [];
    for(let match of input.matchAll(autoRegex)){
        const task = match[0];
        const dates = task.match(datesRegex);
        let reccuringNumber = 1;
        let startDate = "";
        let dueDate = "";
        let scheduledDate = "";
        if(dates && dates.length > 0){
            for(let date of dates){
                if(date.includes("🛫"))
                    startDate = date.replace("🛫","").trim();
                if(date.includes("📅"))
                    dueDate = date.replace("📅","").trim();
                if(date.includes("⏳"))
                    scheduledDate = date.replace("⏳","").trim();
            }
        }
        const recuringMatch = task.match(reccuringRegex);
        const reccuringType = recuringMatch && !recuringMatch[3]? recuringMatch[2] : "none";
        reccuringNumber = recuringMatch && recuringMatch[1] ? parseInt(recuringMatch[1].trim()) : 1;
        result.push({task,startDate,dueDate,scheduledDate,reccuringType, reccuringNumber});
    }
    return result;
}

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
    const randomTime = Math.random() * timeDiff;
    const randomDate = startDate.add(randomTime, 'days');

    return randomDate.format('YYYY-MM-DD');
}

export {getRandomTime};