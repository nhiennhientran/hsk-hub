export type View='courses'|'lesson'|'homework'|'practice'|'progress'|'listening';
export interface Route{view:View;lesson:number;part:string}
export function parseRoute(hash:string,count:number):Route{const p=new URLSearchParams(hash.replace(/^#/,'')),v=p.get('view'),n=Number(p.get('lesson')??1);return {view:['courses','lesson','homework','practice','progress','listening'].includes(v??'')?v as View:'courses',lesson:Number.isInteger(n)&&n>=1&&n<=count?n:1,part:p.get('part')??'vocabGrammar'}}
export function routeHref(route:Partial<Route>):string{return '#'+new URLSearchParams({view:route.view??'courses',lesson:String(route.lesson??1),...(route.part?{part:route.part}:{})}).toString()}
