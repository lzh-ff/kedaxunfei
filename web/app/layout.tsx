import './globals.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'职教自适应学习助手',description:'面向电子商务运营岗位的自适应学习工作台。诊断、路径、阅读、练习与岗位实训。',icons:{icon:`${process.env.NEXT_PUBLIC_BASE_PATH||''}/icon.svg`}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
