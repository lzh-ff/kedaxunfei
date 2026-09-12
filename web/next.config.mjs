const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/kedaxunfei';
export default {output:'export',basePath,trailingSlash:true,images:{unoptimized:true},poweredByHeader:false,outputFileTracingRoot:process.cwd(),env:{NEXT_PUBLIC_BASE_PATH:basePath}};
