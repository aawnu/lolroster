![League of Legends: Roster](.github/readme/preview.png)

> Beautify your League of Legends selection/ban phase with a simple click &amp; select tool to build your own layout.
> No further need to use the in-game loading and selection screen while waiting out the spectator delay;
> especially if you have live access to ban/champion picks.

- [Getting Started](#getting-started)
  - [Requirements &amp; Dependencies](#requirements--dependencies)
  - [Download Source Code](#download-source-code)
  - [Install Server Dependencies &amp; Images](#install-server-dependencies--images)
  - [Start Server](#start-server)
    - [Image Endpoints](#image-endpoints)
    - [Image Proportions](#image-proportions)
- [Terms &amp; Policies](#terms--policies)

# Getting Started

*If you are using this for livestreaming; please consider running the server on your livestreaming device so that images are directly accessible to your streaming software rather than loading in through the local network.*

## Requirements &amp; Dependencies 

**This project is running NodeJS and is tested/validated on version 17.x and 18.x**

First we need to check if you already have NodeJS and NPM running on your machine. Please run the following commands in your terminal to ensure they are installed and has the preferred version:
- `node -v` should preferrably be `17.x` or `18.x`
- `npm -v` should preferrably return `8.x` or higher as that is version used through development

If you do not have NodeJS or NPM installed on your machine, you can download it from here:

| System (OS)  | Terminal command / link                |
| ------------ | -------------------------------------- |
| **Windows**  | `winget install -e --id OpenJS.NodeJS` |
| **Macbook**  | `brew install node`                    |
| **Linux**    | `sudo apt install nodejs`              |
| **Download** | https://nodejs.org/en/download/        |

## Download Source Code

First you need to download the source code for this project; please navigate to the "Releases" section in the sidebar or click on the version tagged (Latest) below it. Navigate to "Assets" and download either the `Zip` or `Tar.gz` file.

After the download you can unpack the code anywhere; but I recommend you do it somewhere simple to naviate, like:
| System (OS) | Full Path                   | Shortcut Path |
| ----------- | --------------------------- | ------------- |
| **Windows** | `C:\Users\%USER%\lolroster` | `~\lolroster` |
| **Macbook** | `/Users/%USER%/lolroster`   | `~/lolroster` |
| **Linux**   | `/home/%USER%/lolroster`    | `~/lolroster` |

## Install Server Dependencies &amp; Images

When the server is unpacked, please open your terminal and navigate to the folder in which the server is unpacked. If saved by the example before, simply open your terminal and type `cd` following the shortcut path, eg. `cd ~\lolroster` on Windows.

Now you can simply type `npm run build` to download dependencies and populate images to the server. If you need to re-download images later on, simply use `npm run download`

> It will automaticall find the latest version of League of Legends rotation and download images accordingly

## Start Server

Make sure your reminal is navigated into the server folder, eg. `cd ~\lolroster` on windows.

Now you simply run the command `npm run server` to start the server. Local Host is internally accessible by your machine only. Public Host is by default only accessible by other machines on the same network as you, unless the ip:port is exposed in your router.

```sh
mbs@mbs:~/lolroster$ npm run server

> server
> ts-node --transpile-only server

Local host: http://127.0.0.1:3000
Public host: http://172.30.235.20:3000
```

### Image Endpoints

| Host path                    | Local path             | Description                                          |
| ---------------------------- | ---------------------- | ---------------------------------------------------- |
| `http://ip:port/cache/...`   | `./cache/...`          | Access all cache files through the (local) network   |
| `http://ip:port/live/...`    |                        | Same as cache but with a Refresh header of 2 seconds |
| `http://ip:port/default/...` | `./public/default/...` | Default/placeholder images                           |
| `http://ip:port/champ/...`   | `./public/champ/..`.   | All champion avatars downloaded from Riot            |
| `http://ip:port/banner/...`  | `./public/banner/...`  | All champion banners downloaded from Riot            |
| `http://ip:port/spell/...`   | `./public/spell/...`   | All spell icons downloaded from Riot                 |

### Image Proportions

| Image  | Size in pixels  |
| ------ | --------------- |
| Avatar | `120w` x `120h` |
| Banner | `308w` x `560h` |
| Spell  | `64w` x `64h`   |

# Terms &amp; Policies

- [LoLRoster MIT License](LICENSE)
- [Riot Games Developer Policies](https://developer.riotgames.com/policies/general)