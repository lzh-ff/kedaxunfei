export type View='home'|'mastery'|'reading'|'workspace'|'space'|'memory'|'knowledge'|'settings'|'guide'|'diagnosis'|'practice';
export type Attempt={questionId:string;choice:number;at:string};
export type Message={role:'user'|'assistant';text:string;sourceIds?:string[];suggestions?:string[];mode?:string};
export type Conversation={id:string;title:string;messages:Message[];context:Record<string,unknown>};
export type LearningState={version:2;attempts:Attempt[];reads:string[];minutes:number;selectedSkill:string;note:string;pricing:Record<string,number>;scenario:string;level:string;steps:boolean[];conversations:Conversation[];activeConversation:string|null;theme:'light'|'dark';};
export type ChatRequest={question:string;context:Record<string,unknown>;pricing:Record<string,number>;skill:string;mode:'explain'|'coach';history:Message[]};
export type ChatResponse={text:string;sourceIds:string[];suggestions:string[];context:Record<string,unknown>;mode:'local'|'model'};
