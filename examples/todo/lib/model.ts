const data = Bun.file("data.json");
if (!(await data.exists())) {
    await Bun.write(
        "data.json",
        JSON.stringify(
            {
                filter: "all",
                items: [],
            },
            null,
            2,
        ),
    );
}

interface Model {
    items: Item[];
    filter: Filter;
}

interface Item {
    id: number;
    text: string;
    done: boolean;
}

export type Filter = "all" | "active" | "completed";

export const model: Model = JSON.parse(await Bun.file("data.json").text());

export async function saveModel() {
    await Bun.write("data.json", JSON.stringify(model, null, 2));
}
