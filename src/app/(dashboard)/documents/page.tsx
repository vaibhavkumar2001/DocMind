import { UserButton } from "@clerk/nextjs";

export default function DocumentsPage() {
    return (
        <main className="mx-auto max-w-4xl p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Documents</h1>
                <UserButton/>
            </div>
            <p className="mt-4 text-slate-500">
                This is the documents page here you can see all your documents
            </p>
        </main>
    )
}