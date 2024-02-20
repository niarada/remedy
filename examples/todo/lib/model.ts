const data = Bun.file("data.json");
if (!(await data.exists())) {
    await Bun.write(
        "data.json",
        JSON.stringify(
            {
                items: [],
            },
            null,
            2,
        ),
    );
}

interface Model {
    items: Item[];
}

interface Item {
    text: string;
    done: boolean;
}

export const model: Model = JSON.parse(await Bun.file("data.json").text());

export async function saveModel() {
    await Bun.write("data.json", JSON.stringify(model, null, 2));
}
