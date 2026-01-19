import { LoginClient } from "./LoginClient"



export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ returnTo?: string }> }) {
const sp = await searchParams
	return <LoginClient returnTo={sp?.returnTo} />
}

