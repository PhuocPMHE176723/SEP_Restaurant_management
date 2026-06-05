const isProduction = process.env.NODE_ENV === "production";

const localApiBaseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL ?? "http://localhost:5000";
const deployApiBaseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL_DEPLOY ??
	"https://g26-api-d2gph2dvhgc6gxfg.eastasia-01.azurewebsites.net";

export const apiBaseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL ??
	(isProduction ? deployApiBaseUrl : localApiBaseUrl);

export const apiUrl =
	process.env.NEXT_PUBLIC_API_URL ??
	(apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`);
