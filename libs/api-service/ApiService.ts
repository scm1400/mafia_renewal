import { parseJsonString } from "../utils/Common";

export class ApiService {
	private static instance: ApiService;

	public quizSetId: string;
	public baseUrl: string;

	private constructor() {
		this.baseUrl = "url";
	}

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	private buildUrl(endpoint: string, params?: Record<string, string>): string {
		let url = `${this.baseUrl}${endpoint}`;
		if (params) {
			const queryParams = Object.keys(params)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
				.join("&");
			if (queryParams) {
				url += `?${queryParams}`;
			}
		}
		return url;
	}

	private handleResponse(response: string): any {
		const parsedData = parseJsonString(response);
		if (parsedData === false) {
			return null;
		}
		return parsedData.data || parsedData;
	}
}
