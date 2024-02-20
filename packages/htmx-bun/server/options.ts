export interface ServerOptions {
	port?: number;
	features?: ServerOptionsFeatures;
}

interface ServerOptionsFeatures {
	tailwind?: boolean;
	htmx?: boolean;
	sse?: boolean;
	view?: boolean;
	static?: boolean;
	dev?: boolean;
}

const options = {
	port: 4321,
	features: {
		tailwind: true,
		htmx: true,
		sse: true,
		view: true,
		static: true,
		dev: import.meta.env.NODE_ENV === "development",
	},
};

export default options;
