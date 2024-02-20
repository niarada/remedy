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
    items: string[];
}

export const model: Model = JSON.parse(await Bun.file("data.json").text());

export default async function saveModel() {
    await Bun.write("data.json", JSON.stringify(model, null, 2));
}
