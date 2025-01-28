import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config"
import packageJson from "./package.json" with { type: "json" }

const { name, displayName } = packageJson
// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
	...ManifestConfig,
	author: {
		email: "marvinkrebber@yahoo.de",
	},
	key: env[
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnNxyk3xv8ExvmREOwq7387UYsKbCRQc+Lg0PXlAwERWEAn5zoXpIto4IJvsvFvVl0n9VfkRf37BNDQ+9mElupj1rTcqb7SEwqqZbTNUUoXVfsHdRCkmofmjct3o5O18BGK78ZtSXIICZDCNhiIhoTox1ZtsMQLx23j9EBCjRR4+PXofuK7Y4bDZQznKUvrnaddRlifLTYPHE+MN08SUpC6l0OUdGCcKJHDUAKsDIbmvL9KtuQntkZBDUqrMud/Yw3k7zgopd7vRSTvpICqaH0n9i1u3i6uaMRBI/czr35w/tQjhjXimJh9CgQh+F74Yn6JzLtMAB8qe1dp5NEL0xEQIDAQAB"
	],
}))
