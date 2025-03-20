import { App, TFolder } from 'obsidian';
import { getAPI, DataviewApi } from 'obsidian-dataview';
import Graph from 'graphology';
import { GraphOptions } from 'graphology-types';

export default class ContextGraph extends Graph{
    app: App;
    dv: DataviewApi;
    officePages: string[];
    office: any;
    constructor(app: App, officePages: string[], options?: GraphOptions){
        super(options);
        this.app = app;
        this.dv = getAPI(app);
        
        setTimeout(() => {this.reload(officePages)},3000);
    }

    setOfficePages = (officePages: string[]) => {
        const filteredPages = officePages.filter(p=>this.app.vault.getAbstractFileByPath(p) instanceof TFolder);
        this.officePages = filteredPages.length > 0 ? filteredPages : ["/"];
    }
    reload = (officePages?: string[]) =>{
        this.clear();
        if(officePages) this.setOfficePages(officePages);
        this.office = this.dv.pages(`${this.officePages.map(el => `"${el}"`).join(' or ')}`);
        this.office.forEach((p: any) => {
            if(!this.hasNode(p.file.path)) this.addNode(p.file.path);
            if(p.context?.path){
                if(!this.hasNode(p.context.path)) this.addNode(p.context.path);
                if(!this.hasEdge(p.context.path,p.file.path))this.addEdge(p.context.path, p.file.path);
            }
        });

    }
    getParents = (node: string, parents: string[] = []): string[] =>{
        if(!this.hasNode(node)) return parents;
        const edges = this.inEdges(node);
        if(edges.length == 0) return parents;
        else{
            parents.push(this.source(edges[0]));
            return this.getParents(this.source(edges[0]), parents);
        }
    }
    getChilds = (node: string, depth: number = 0, childs: { path?: string, depth?: number }[] = []): any => {
        if(!this.hasNode(node)) return childs;
        const edges = this.outEdges(node);
        if (edges.length == 0) return childs;
        else {
            edges.forEach((edge: any) => {
                childs.push({ path: this.target(edge), depth });
                return this.getChilds(this.target(edges[0]), depth + 1, childs);
            });
            return childs;
        }
    }
}