import { PiniaPluginContext } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import i18n from '@/i18n'
/* eslint-disable */
function serialize(obj: any): string {
  if (typeof obj === 'string') {
    return obj
  }
  return JSON.stringify(obj)
}

function deserialize(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

export default async function ({ store }: PiniaPluginContext) {
  for (const key of Object.keys(store.$state)) {
    try {
      const storedData = (
        await Preferences.get({
          key: `${store.$id}.${key}`
        })
      ).value
      if (storedData) {
        store[key] = deserialize(storedData)
      }
    } catch (err) {
      console.error(err)
    }
  }

  store.$subscribe(
    async (_, state) => {
      if (!state) {
        return
      }
      for (const key of Object.keys(state)) {
        if (state[key]) {
          try {
            await Preferences.set({
              key: `${store.$id}.${key}`,
              value: serialize(state[key])
            })
          } catch (err) {
            console.error(err)
          }
        } else {
          await Preferences.remove({
            key: `${store.$id}.${key}`
          })
        }
      }
    },
    {
      detached: true
    }
  )
  //@ts-ignore
  i18n.global.locale.value = store.settings?.language
  store.$ready = true
}
