import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8")
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]

test("the theme bootstrap runs in the head before the application module", () => {
  assert.ok(bootstrap, "A synchronous inline theme script must be present")
  assert.ok(html.indexOf(bootstrap) < html.indexOf("</head>"))
  assert.ok(html.indexOf(bootstrap) < html.indexOf('type="module"'))
})

function initialize(storedTheme, systemDark, storageBlocked = false) {
  const classes = new Set()
  const root = {
    classList: {
      add: (value) => classes.add(value),
      remove: (...values) => values.forEach((value) => classes.delete(value)),
    },
    style: {},
  }
  const context = {
    document: { documentElement: root },
    window: {
      matchMedia: (query) => {
        assert.equal(query, "(prefers-color-scheme: dark)")
        return { matches: systemDark }
      },
    },
  }
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storageBlocked) throw new Error("Storage blocked")
      return {
        getItem: (key) => {
          assert.equal(key, "theme")
          return storedTheme
        },
      }
    },
  })
  runInNewContext(bootstrap, context)
  return { theme: [...classes], colorScheme: root.style.colorScheme }
}

test("the saved preference wins over the OS before React or the body exists", () => {
  for (const [stored, systemDark, expected] of [
    ["dark", false, "dark"],
    ["light", true, "light"],
    ["system", true, "dark"],
    ["system", false, "light"],
    [null, true, "dark"],
    [null, false, "light"],
    ["invalid", true, "dark"],
    ["invalid", false, "light"],
  ]) {
    assert.deepEqual(initialize(stored, systemDark), {
      theme: [expected],
      colorScheme: expected,
    })
  }
})

test("blocked storage still applies the OS theme before the first render", () => {
  for (const dark of [true, false]) {
    const expected = dark ? "dark" : "light"
    assert.deepEqual(initialize(null, dark, true), {
      theme: [expected],
      colorScheme: expected,
    })
  }
})
