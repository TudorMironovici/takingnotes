This fork adds an OCR feature to the Export functionality. As a disclaimer, OCR (especially on hand writting) is quite challenging computationally, and it's not my specialty. My intention is to have something quick that'll get you 80% of the way there & one which can easily be editable on the spot. This is a light-weight implementation that runs locally rather than having to make any API calls, so the results won't be perfect. But it can save you the step (and potential cost) of exporting to a png and uploading it to some 3rd party service like Evernote. Quick overview:

No changes were made to the overall UI
![main UI with "I hope you have a great weekend" handwritten on the canvas](https://i.imgur.com/JSrEbG2.png)

When exporting, there is a new "Text (using OCR)" option
![Export modal with new Text option in Export As dropdown hovered over](https://i.imgur.com/h9mT4wn.png)

Selecting the new option will bring up the new OCR menu. There's an option to select language the handwriting is in that should help with recognition and an "Extract Text" button that will trigger the OCR functionality from the Tesseract library 
![Export as text menu](https://i.imgur.com/QMENH0o.png)

After a (hopefully) short load time, the extracted text will populate in a text box. The clearer your handwritting, the better the results. It won't be perfect, as you can see in the image. But, you can easily click on the text and edit it inside the text box. There's also a character count at the bottom. Once you're ready, you can copy the text or export as a .txt file.
![Export modal with new Text option in Export As dropdown hovered over](https://i.imgur.com/KoOTq9S.png)




Original readme:

DISCLAIMER: For transparency's sake (mainly because I don't want to take unfair credit for stuff): the research and testing here was done by me (as you can see on www.f4mi.com on the video where we talk about this), I did end up using local LLMs to help me with building the websites based on that research and cleaning up/helping me with docs/pushing some stuff to GitHub, as I said in the video I don't know shit and I am pretty much learning on the fly. Some of them for some reason (which I mean, isn't that mysterious if you consider how the sausage is made) think they are Claude. So if you see Claude mentions here, that's why lol

# takingnotes.ink

Drawing and animation studio for the Huion X10 and the Wacom Slate/Spark series of smart notebooks that runs in the browser, with experimental mobile support. Built with React, TypeScript, and Vite.

Wacom SmartPad support in this project was informed by the [tuhi project](https://github.com/tuhiproject/tuhi).

Supports layered canvas editing, animation timeline with playback/export, experimental mobile support, and pen tablet input via Web Bluetooth and WebHID.

## Quick Start

```sh
npm install
npm run dev
```

Requires Node.js 20+. Dev server runs at `localhost:3000`.

## Build

```sh
npm run build    # production build → dist/
npm run preview  # serve the build locally
```

## Deploy To Cloudflare

This app is a static Vite build, so the simplest hosting target is Cloudflare Pages.

### Option 1: Cloudflare dashboard

1. Push this repo to GitHub.
2. In Cloudflare, go to Workers & Pages -> Create -> Pages -> Connect to Git.
3. Select this repository.
4. Use these build settings:

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Node.js version: 20
```

5. Deploy.

### Option 2: Wrangler CLI

```sh
npm install
npm run build
npm run cf:deploy
```

If Wrangler asks you to authenticate, run:

```sh
npx wrangler login
```

The repository already includes a `wrangler.toml` with:

```toml
pages_build_output_dir = "./dist"
```

To avoid Cloudflare Pages using Node 22 for this repo, keep the Pages project Node.js version pinned to `20`. The repo also includes a `.nvmrc` file for the same reason.

### Custom domain

After the first deploy, open your Cloudflare Pages project, go to Custom domains, and attach `takingnotes.ink` or any other domain you want to use.

### Browser API note

Web Bluetooth and WebHID need HTTPS in Chrome or Edge. Cloudflare Pages serves over HTTPS by default, so hosting there satisfies that requirement.

## Tablet Support

Pen tablet features (Huion, Wacom) require Chrome or Edge and an HTTPS connection.

## What works
Drawing live from both Wacom and Huion smart notebooks, plus notebook page download from both device families and experimental mobile support

## Todo
Fix small UI bugs
