'use client';
import {createContext,useContext} from 'react';
import type {LearningState,View} from '@/contracts/learning';
type TutorContext={state:LearningState;update:(updater:Partial<LearningState>|((s:LearningState)=>LearningState))=>void;navigate:(view:View,skill?:string)=>void;notify:(message:string)=>void;openKnowledge:(id:string)=>void;ask:(question:string)=>void;exportReport:()=>void;feedback:()=>void;clear:()=>void;};
export const Context=createContext<TutorContext|null>(null);
export function useTutor(){const ctx=useContext(Context);if(!ctx)throw new Error('Tutor context missing');return ctx;}
