# @certifaction/vue-pdf-viewer

PDF-Viewer for VueJS 2 based on Mozillas [PDF.js](https://mozilla.github.io/pdf.js/).

> Branch [`1.x`](https://github.com/certifaction/js-pdf-viewer/tree/1.x) is for VueJS 2. Branch [`main`](https://github.com/certifaction/js-pdf-viewer/tree/main) is for VueJS 3.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/).

## Project Setup

```sh
pnpm install
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm run lint
```

## Create new release / publish to GitHub Packages

1. Create release branch (has to start with `releases/`). It's best to name the branch according to the version you want to release (ex. `releases/v1.2.3`, or `releases/v2.0.0-rc.0`). The branch name isn't used for the actual release tough.

2. Execute `pnpm run create-version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]`. It's recommended to specify the version directly like this: `pnpm run create-version 1.0.0`

3. Commit and push the changes created by pnpm.

4. Create PR based on the release branch and merge it. This will automatically publish the release to GitHub Packages.
