import { RegisterClient } from "./RegisterClient"

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string }> }) {
const sp = await searchParams
	return <RegisterClient returnTo={sp?.returnTo} />
}

