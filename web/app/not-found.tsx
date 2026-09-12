export default function NotFound(){return <main className="not-found"><h1>这个学习页面没有找到</h1><p>你的本机学习记录仍会保留。</p><a href={`${process.env.NEXT_PUBLIC_BASE_PATH||''}/`}>返回学习首页 →</a></main>;}
