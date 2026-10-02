import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/src/server/user";

export default async function DocumentsPage() {

    const user = await getOrCreateUser();

    return (
        <main className="mx-auto max-w-4xl p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Documents</h1>
                <UserButton/>
            </div>
            <p className="mt-4 text-slate-500">
                Welcome, { user?.name ?? user?.email }. Here you can find all your documents
            </p>
        </main>
    )
}