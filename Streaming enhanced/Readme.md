# Frontend

## Used Technologies

- Typescript
- Vue 3
  - Composition API with setup script syntax
  - Vuex state management
- Ionic


## Docs

- [Ionic Quickstart](https://ionicframework.com/docs)
- [Ionic Components](https://ionicframework.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [Vue](https://vuejs.org/guide/introduction.html)

# Installation

**_IMPORTANT!: Please follow the official installation guide to avoid unnecessary problems_**

- [Node and npm LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Ionic](https://ionicframework.com/docs/intro/cli)

## Development

Run `npm run dev`. A browser page will automatically be opened (check your terminal for the local service adress).


## Work with Localization

To translate a string add the value in de.json and add
  
  ```json
  "test.path": "hallo"
  ```

to the `src/i18n/de.json` file. Then you can use the translation in the components like this:
  
  ```typescript
  {{ $t('test.path') }}
  ```

### Dates

current options: short,long more can be added in dateTimeFormats.json
  ```typescript
{{ $d(new Date(), "long") }}
  ```

### Numbers

current options: currency, decimal, coord, percent
  ```typescript
{{ $n(1234.56, "currency") }}
  ```

## Work with the localstorage (pinia store)

Mapstate is to only acsess the local storage and mapWritableState is to also write to it. The first argument is the store and the second is the key in the local storage. If you want to rename the key in the store you can use an object as the second argument with the key as the value and the new name as the key.
```typescript
import { mapState, mapWritableState } from "pinia";
computed: {
    ...mapState(useAppStore, ["projectId"]),
    ...mapWritableState(useAppStore, ["settings"]),
    ...mapState(useAppStore, {
      deviceId: "uuid",
    }),
}
```

## Work with Icons

Search for the icons on the [material design icons page](https://pictogrammers.com/library/mdi/) and use the name of the icon in vue-material-design-icons

```typescript
import DotsVerticalIcon from 'vue-material-design-icons/DotsVertical.vue'
components: {
    DotsVerticalIcon
}
```