/**
 * Functions used in the Personal OS Vault : https://personal-os.wktmty.com/
 */
import { App, TFile, TFolder } from 'obsidian';
import { getAPI, DataviewApi } from 'obsidian-dataview';
import { calculateTotalPoints, currentLevelBasedOnXp, totalXpToTargetLevel, xpForNextLevel } from 'src/Tools/Utils';

export default class POSVaultFunctions {
    app: App;
    dv: DataviewApi;
    configFolder: string;
    constructor(app: App, configFolder: string){
        this.app = app;
        this.dv = getAPI(app);
        this.setConfigFolder(configFolder);
    }
    setConfigFolder = (configFolder: string) => {
        this.configFolder = this.app.vault.getAbstractFileByPath(configFolder || '/') instanceof TFolder ? configFolder : '';
        if(this.configFolder === '/' || this.configFolder === '')
            this.configFolder = '';
        else if(!this.configFolder.endsWith('/'))
            this.configFolder += '/';
    }

    rewardActiveFile = () => {
        let file = this.app.workspace.getActiveFile();
        
        if (!file) {
            console.log("Dataview API or active file not found.");
            return;
        }
        
        // Fetch all lists from the current file that match the "Rewards" subpath
        let lists = this.dv.page(file.path)?.file.lists.where((l: any) => l.header.subpath && l.header.subpath == "Rewards") || [];
     
        const processLinkedFile = async (list: any) => {
            if (!list.outlinks || list.outlinks.length !== 1) {
                console.log("No valid outlink found in the task.");
                return;
            }
        
            let linkedFilePath = list.outlinks[0].path; // Extract the linked page path
            let linkedPage = this.dv.page(linkedFilePath);
        
            if (!linkedPage) {
                console.log(`Linked file not found: ${linkedFilePath}`);
                return;
            }
        
            let linkedPagePath = linkedPage.file.path;
            let targetFile = this.app.vault.getAbstractFileByPath(linkedPagePath);
        
            if (!targetFile || !(targetFile instanceof TFile)) {
                console.log(`Target file not found: ${linkedFilePath}`);
                return;
            }
        
            if (linkedPage.tags?.includes("Competence") || linkedPage.tags?.includes("Skill")) {
                let listLevel = list['level'];
                if (listLevel === undefined) {
                    console.log("No 'level' property found in the list item.");
                    return;
                }
                        
                // Update the Level
                await this.app.fileManager.processFrontMatter(targetFile as TFile, (frontmatter: any) => {
                    let currentLevel = frontmatter['Level'] || 0; // Default to 0 if no level is set
                    if (listLevel > currentLevel) {
                        frontmatter['Level'] = listLevel; // Update the level only if it is higher
                        console.log(`Updated Level of ${linkedFilePath} to ${listLevel}`);
                    } else {
                        console.log(`Skipped updating ${linkedFilePath}: current Level (${currentLevel}) is higher or equal.`);
                    }
                });
            } else if (linkedPage.tags?.includes("Achievement")) {
                // Set the Completed on date if not already set
                await this.app.fileManager.processFrontMatter(targetFile as TFile, (frontmatter: any) => {
                    if (!frontmatter['Completed On']) {
                        let currentDate = new Date().toISOString().slice(0, 10);
                        frontmatter['Completed On'] = currentDate;
                        console.log(`Set 'Completed on' for ${linkedFilePath} to ${currentDate}`);
                    } else {
                        console.log(`'Completed on' already set for ${linkedFilePath}: ${frontmatter['Completed On']}`);
                    }
                });
            }
        
            // Append "✔️" to the list item
            await modifyListItem(list.line + 1);
        }
     
        const modifyListItem = async (line: number) => {
            let fileContent = await this.app.vault.read(file!);
            let lines = fileContent.split("\n");
        
            if (line <= 0 || line > lines.length) {
                console.log(`Line ${line} is out of bounds.`);
                return;
            }
        
            if (!lines[line - 1].includes("✔️")) {
                lines[line - 1] += " ✔️"; // Append the checkmark
                await this.app.vault.modify(file!, lines.join("\n"));
                console.log(`Added "✔️" to list item at line ${line}.`);
            } else {
                console.log(`List item at line ${line} already has "✔️".`);
            }
        }
        
        // Iterate over all lists sequentially to avoid async conflicts
        (async () => {
            for (let list of lists) {
                await processLinkedFile(list);
            }
            console.log("Completed processing all linked files and list items.");
        })();
    }

    mapWidget = (dv: any) =>{
        // Helper function to extract the template path
        const getTemplatePath = (currentFile: any) =>{
            const templateLink = currentFile["Uses Template"]?.path; // Extract the path from "Uses template"
            return templateLink || null; // Return the path or null if not defined
        }

        // Helper function to check if a requirement is met
        const isRequirementMet = (req: any, headerType: string) => {
            const outlink = req.outlinks?.[0]?.path; // First outlink in the requirement
            const levelProp = req.level; // Level property in the requirement, if any

            if (!outlink) return false; // No outlink means requirement cannot be met

            const targetFile = this.dv.page(outlink); // Get the file metadata of the outlink

            if (!targetFile) return false; // If the target file doesn't exist, requirement is not met

            // Check requirements based on the header type
            if (headerType === "Competences and skills") {
                if (targetFile.tags.includes('Competence') || targetFile.tags.includes('Skill')) {
                    const requiredLevel = levelProp || 0; // Default level to 0 if not specified
                    const targetLevel = targetFile.Level || 0; // Default level of the linked file to 0
                    return targetLevel >= requiredLevel; // Requirement is met if target level >= required level
                }
            } else if (headerType === "Completed missions") {
                if (targetFile.tags.includes('Mission-Description')) {
                    return !!targetFile["Completed on"]; // Requirement is met if "Completed on" exists
                }
            } else if (headerType === "Obtained achievements") {
                if (targetFile.tags.includes('Achievement')) {
                    return !!targetFile["Completed on"]; // Requirement is met if "Completed on" exists
                }
            }

            return false; // Default to requirement not met if no match
        }

        // Function to calculate progress across all requirement types
        const calculateRequirementProgress = (currentFile: any) => {
            const allRequirements = currentFile.file.lists?.filter(
                (list: any) => ["Competences and skills", "Completed missions", "Obtained achievements"].includes(list.header.subpath)
            ) || [];

            const totalRequirements = allRequirements.length;
            let metRequirements = 0;

            for (const req of allRequirements) {
                const headerType = req.header.subpath;
                if (isRequirementMet(req, headerType)) {
                    metRequirements++;
                }
            }

            const percentProgress = totalRequirements > 0 ? Math.round((metRequirements / totalRequirements) * 100) : 0;

            return { totalRequirements, metRequirements, percentProgress };
        }

        // Function to check if the current file is available
        const isCurrentFileAvailable = (currentFile: any) => {
            const requirements = currentFile.file.lists?.filter(
                (list: any) => ["Competences and skills", "Completed missions", "Obtained achievements"].includes(list.header.subpath)
            ) || [];

            for (const req of requirements) {
                const headerType = req.header.subpath; // Header type (e.g., "Competences and skills")
                if (!isRequirementMet(req, headerType)) {
                    return false; // If any requirement is not met, the mission is unavailable
                }
            }

            return true; // All requirements are met, the mission is available
        }

        // Function to check if the mission is in progress
        const isMissionInProgress = (templatePath: any) => {
            const referencingFiles = this.dv.pages("#Course OR #Mission OR #Exercise")
                .where((file: any) => file["From Template"]?.path === templatePath && file.Archived !== true);

            return referencingFiles.values.length > 0 ? referencingFiles.values[0] : null; // Return the first in-progress file if it exists
        }

        // Function to calculate task progress
        const calculateTaskProgress = (inProgressFile: any) => {
            const totalTasks = inProgressFile.file.lists?.filter((list: any) => list.task)?.length || 0;
            const completedTasks = inProgressFile.file.lists?.filter((list: any) => list.task && list.completed)?.length || 0;
            const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return { totalTasks, completedTasks, percentComplete };
        }

        // Convert difficulty number to stars or ☠️ if > 5
        const formatDifficulty = (difficulty: number) => {
            if (!difficulty || isNaN(difficulty)) return "Unknown";
            return difficulty > 5 ? "☠️" : "⭐".repeat(difficulty);
        }

        // Get the appropriate image for unavailable missions
        const getUnavailableImage = (currentFile: any, templateFile: any) => {
            if (currentFile.Difficulty > 5) {
                return `${this.configFolder}Images/Mission boss fight image-1.png`;
            } else if (templateFile.tags?.includes("Mission-Template")) {
                return `${this.configFolder}Images/Mission combat image-1.png`;
            } else if (
                templateFile.tags?.includes("Course-Template") ||
                templateFile.tags?.includes("Exercise-Template")
            ) {
                return `${this.configFolder}Images/Mission training image-1.png`;
            } else {
                return null; // Fallback if no condition is met
            }
        }

        // Check if the current file is a mission
        const currentFile = dv.current();
        const templatePath = getTemplatePath(currentFile);
        const templateFile = templatePath ? this.dv.page(templatePath) : null;

        if (currentFile && currentFile.tags?.includes("Mission-Description") && templatePath) {
            const isAvailable = isCurrentFileAvailable(currentFile);
            const isCompleted = !!currentFile["Completed on"];
            const inProgressFile = isMissionInProgress(templatePath);

            if (isCompleted) {
                // Completed mission layout
                const completionDate = new Date(currentFile["Completed on"]).toISOString().split('T')[0];
                dv.paragraph(`<h1>${currentFile.file.name}</h1>`); // Mission title
                dv.paragraph(`<h2 style="color: green;">✅ Completed on ${completionDate}</h2>`);
                dv.paragraph(`<h3>Difficulty: ${formatDifficulty(currentFile.Difficulty)}</h3>`);
                dv.paragraph(`!${currentFile.Image}`); // Embed mission image
            } else if (inProgressFile) {
                // In-progress mission layout
                const progress = calculateTaskProgress(inProgressFile);
                dv.paragraph(`<h1>${currentFile.file.name}</h1>`); // Mission title
                dv.paragraph('<h2 style="color: lightblue;">In Progress</h2>');

                // Render task progress bar
                const pb = dv.el("progress-bar", `${progress.percentComplete}%`, {
                    attr: {
                        value: progress.percentComplete,
                        max: 100,
                        style: "width: 100%; text-align: center; color: white;",
                    },
                });

                dv.paragraph(pb);
                dv.paragraph(`<p>${progress.completedTasks} / ${progress.totalTasks} tasks completed</p>`);
                dv.paragraph(`!${currentFile.Image}`); // Embed mission image

                // Render the "Continue" button
                dv.paragraph(`
\`\`\`meta-bind-button
label: Continue
icon: ""
hidden: false
class: ""
tooltip: ""
id: ""
style: primary
actions:
  - type: open
    link: "[[${inProgressFile.file.path}]]"
    newTab: true
\`\`\`
        `);
            } else if (isAvailable) {
                // Available mission layout
                dv.paragraph(`<h1>${currentFile.file.name}</h1>`); // Mission title
                dv.paragraph('<h2 style="color: green;">Available</h2>');
                dv.paragraph(`<h3>Difficulty: ${formatDifficulty(currentFile.Difficulty)}</h3>`);
                dv.paragraph(`!${currentFile.Image}`); // Embed mission image

                // Render the "Launch" button
                dv.paragraph(`
\`\`\`meta-bind-button
label: Generate mission
icon: ""
hidden: false
class: ""
tooltip: ""
id: ""
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "${templatePath}"
    folderPath: "2.Activities/TRAIN_Personal OS"
    fileName: Rename
    openNote: true
\`\`\`
        `);
            } else {
                // Unavailable mission layout
                dv.paragraph('<h2 style="color: red;">Unavailable</h2>');

                // Requirement advancement
                const { totalRequirements, metRequirements, percentProgress } = calculateRequirementProgress(currentFile);

                const pb = dv.el("progress-bar", `${percentProgress}%`, {
                    attr: {
                        value: percentProgress,
                        max: 100,
                        style: "width: 100%; text-align: center; color: white;",
                    },
                });

                dv.paragraph(pb);
                dv.paragraph(`<p>${metRequirements} / ${totalRequirements} requirements met</p>`);

                // Difficulty
                dv.paragraph(`<h3>Difficulty: ${formatDifficulty(currentFile.Difficulty)}</h3>`);

                // Standard images
                const unavailableImage = getUnavailableImage(currentFile, templateFile);
                if (unavailableImage) {
                    dv.paragraph(`![[${unavailableImage}]]`);
                }
            }
        }
    }

    getTotalXP = () => 
        calculateTotalPoints(this.dv)

    getCurrentLevel = () => 
        Math.floor(currentLevelBasedOnXp(calculateTotalPoints(this.dv),2,2))
    

    getXPProgressBar = (dv: any) => {        
        const {differencialXp, xpRequired} = this.getCurrentLevelXP();
        dv.paragraph(  
            dv.el("progress-bar", "", { attr: {value: Math.round((differencialXp / xpRequired) * 100), style:"width=50%;"}}) 
        )  
        dv.paragraph(`<p>${differencialXp} / ${xpRequired} xp</p>`);
        
    }

    getCurrentLevelXP = () => {
        const x=2;
        const y=2;
        const points = calculateTotalPoints(this.dv);
        const level = Math.floor(currentLevelBasedOnXp(points,x,y));
        const neededXp = Math.floor(totalXpToTargetLevel(level,x,y));
        const xpRequired = Math.ceil(xpForNextLevel(level,x,y));
        const differencialXp = points - neededXp;

        return {differencialXp, xpRequired, level};
    }
}
