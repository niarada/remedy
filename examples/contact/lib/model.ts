const data = Bun.file("data.json");

if (!(await data.exists())) {
    await Bun.write(
        "data.json",
        JSON.stringify(
            {
                contacts: [],
            },
            null,
            2,
        ),
    );
}

export const model: Model = JSON.parse(await Bun.file("data.json").text());

export async function saveModel() {
    await Bun.write("data.json", JSON.stringify(model, null, 4));
}

interface Model {
    contacts: Contact[];
}

interface Contact {
    id: number;
    first: string;
    last: string;
    phone: string;
    email: string;
}

export async function createContact(data: Omit<Contact, "id">) {
    const contact: Contact = {
        id: model.contacts.length
            ? Math.max(...model.contacts.map((c) => c.id)) + 1
            : 1,
        ...data,
    };
    model.contacts.push(contact);
    saveModel();
}
