let tr_cachedTokens = [];
let tr_replaceToken;
let tr_tokenDirectory;
let tr_difficultyName;
let tr_difficultyVariable;
let tr_portraitPrefix;
let tr_imageNameFormat;
let tr_isTRDebug = false;
let tr_useStructure = true;
let tr_nameFormats = [];
let tr_folderFormats = [];

import {tr_tokenPathDefault, tr_difficultyNameDefault, tr_difficultyVariableDefault, tr_portraitPrefixDefault, tr_useStructureDefault, tr_BAD_DIRS} from 'defaults.js';
import {TokenReplacerSetup} from 'setup.js';
import {DirectoryPicker} from 'directory-picker.js';
import {TokenReplacerDisabler} from 'disabler.js';

const TokenReplacer = {
    grabSavedSettings() {
        tr_replaceToken = game.settings.get("token-replacer", "replaceToken") ?? 0;
        if (game.settings.get("token-replacer", "tokenDirectory") === "[data] " || "") {
            tr_tokenDirectory = { 
                activeSource: "data",
                current: tr_tokenPathDefault,
            }
        } else {
            tr_tokenDirectory = DirectoryPicker.parse(game.settings.get("token-replacer", "tokenDirectory"))
        }    
        tr_difficultyName = game.settings.get("token-replacer", "difficultyName");
        tr_difficultyVariable = game.settings.get("token-replacer", "difficultyVariable");
        tr_portraitPrefix = game.settings.get("token-replacer", "portraitPrefix");

        let imageNameFormatIndex = game.settings.get("token-replacer", "imageNameFormat");    
        if (imageNameFormatIndex === null || imageNameFormatIndex === -1) {
            imageNameFormatIndex = 0;
        }    
        tr_imageNameFormat = tr_nameFormats[imageNameFormatIndex].value;
        if (tr_imageNameFormat === "proper") {
            tr_imageNameFormat = " ";
        }

        let folderNameFormatIndex = game.settings.get("token-replacer", "folderNameFormat");    
        if (folderNameFormatIndex === null || folderNameFormatIndex === -1) {
            folderNameFormatIndex = 0;
        }    
        folderNameFormat = tr_folderFormats[folderNameFormatIndex].value;
        if (folderNameFormat === "proper") {
            folderNameFormat = " ";
        }

        tr_useStructure = game.settings.get("token-replacer", "structure");
        tr_isTRDebug = game.settings.get("token-replacer", "debug");
    },
    
    hookupEvents() {
        // setup hook for replacement before and during actor creation
        //Hooks.on("preCreateActor", preCreateActorHook);
        Hooks.on("createActor", TokenReplacer.createActorHook);    
        
        // make sure we change the image each time we drag a token from the actors
        Hooks.on("preCreateToken", TokenReplacer.preCreateTokenHook);
        Hooks.on("createToken", TokenReplacer.createTokenHook);
    },

    // handle preCreateActor hook
    preCreateActorHook(document, options, userId) {
        // grab the saved values
        TokenReplacer.grabSavedSettings();

        if (tr_isTRDebug) {
            console.log(`Token Replacer: preCreateActorHook: Data:`, document);
        }

        let hasDifficultProperty = hasProperty(document, tr_difficultyVariable);
        if (!tr_difficultyVariable) {
            // overwrite since it's empty
            hasDifficultProperty = true;
        }

        if ( !tr_replaceToken || (document.type !== "npc") || !hasDifficultProperty ) return;
        TokenReplacer.replaceArtWork(document);
        document.update({
            "img": document.data.img,
            "token.img": document.data.token.img,
        });    
    },

    // handle createActor hook
    createActorHook(document, options, userId) {
        // grab the saved values
        TokenReplacer.grabSavedSettings();

        if (tr_isTRDebug) {
            console.log(`Token Replacer: createActorHook: Data:`, document);        
        }

        let hasDifficultProperty = hasProperty(document.data, tr_difficultyVariable);
        // Disabling the folder structure hides the relevant input fields but doesn’t actually clear tr_difficultyVariable,
        // so users would have to empty the text field before disabling folder structure if we don’t check for it here:
        if (!tr_difficultyVariable || !tr_useStructure) {
            // overwrite since it's empty
            hasDifficultProperty = true;
        }

        if ( !tr_replaceToken || (document.data.type !== "npc") || !hasDifficultProperty ) return;
        TokenReplacer.replaceArtWork(document.data);
        document.update({
            "img": document.data.img,
            "token.img": document.data.token.img,
        });
    },

    // handle preCreateToken hook
    preCreateTokenHook(document, options, userId) {
        // if we disabled token replacer on this token, use the token that's there
        if (document.data.flags["token-replacer"] && document.data.flags["token-replacer"].disabled) {
            return;
        }

        // grab the saved values
        TokenReplacer.grabSavedSettings();
        const actor = game.actors.get(document.data.actorId);    

        if (tr_isTRDebug) {
            console.log(`Token Replacer: preCreateTokenHook: Before: TokenData:`, document.data);
            console.log(`Token Replacer: preCreateTokenHook: Before: Actor:`, actor);        
        }

        if (actor) {
            if (tr_isTRDebug) {
                console.log(`Token Replacer: preCreateTokenHook: Before: PassData:`, actor.data);
            }

            let hasDifficultProperty = hasProperty(actor.data, tr_difficultyVariable);
            if (!tr_difficultyVariable) {
                // overwrite since it's empty
                hasDifficultProperty = true;
            }

            if ( !tr_replaceToken || (actor.data.type !== "npc") || !hasDifficultProperty ) return;
            TokenReplacer.replaceArtWork(actor.data);
            actor.update({
                "img": actor.data.img,
                "token.img": actor.data.token.img,
            });

            if (tr_isTRDebug) {
                console.log(`Token Replacer: preCreateTokenHook: After: TokenData:`, document.data);
                console.log(`Token Replacer: preCreateTokenHook: After: Actor:`, actor);
                console.log(`Token Replacer: preCreateTokenHook: After: PassData:`, actor.data);
            }
        }        
    },

    async createTokenHook(document, options, userId) {
        // if we disabled token replacer on this token, use the token that's there
        if (document.data.flags["token-replacer"] && document.data.flags["token-replacer"].disabled) {
            return;
        }

        const actor = game.actors.get(document.data.actorId);

        if (tr_isTRDebug) {
            console.log(`Token Replacer: createTokenHook: Before: TokenData:`, document.data);
            console.log(`Token Replacer: createTokenHook: Before: Actor:`, actor);        
        }

        if (actor) {
            const token = new Token(document, document._object.scene);
            token.update({"img": actor.data.token.img});

            if (tr_isTRDebug) {
                console.log(`Token Replacer: createTokenHook: After: TokenData:`, document.data);
                console.log(`Token Replacer: createTokenHook: After: Actor:`, actor);        
            }
        }
    },

    // replace the artwork for a NPC actor with the version from this module
    replaceArtWork(data) {
        if (tr_isTRDebug) {
            console.log(`Token Replacer: Replacing Artwork`);        
        }

        const formattedName = data.name.trim().replace(/ /g, tr_imageNameFormat);
        const diffDir = (tr_difficultyName) ? `${String(getProperty(data, tr_difficultyVariable)).replace(".", "_")}/` : "";
        let folderStructure = `${tr_tokenDirectory.current}/${tr_difficultyName}${folderNameFormat}${diffDir}`;

        if (!tr_useStructure) {
            folderStructure = "";
        }

        let tokenCheck = escape(`${folderStructure}${formattedName}`);
        let portraitCheck;

        if (tr_portraitPrefix) {
            portraitCheck = escape(`${folderStructure}${tr_portraitPrefix}${formattedName}`);
        } else {
            portraitCheck = tokenCheck;
        }

        // Update variable values with single forward slash instead of double in case the setting passed in had a
        // trailing slash and we added another in path assembly.
        portraitCheck = portraitCheck.replace("//","/").toLowerCase();
        tokenCheck = tokenCheck.replace("//","/").toLowerCase();

        if (tr_isTRDebug) {
            console.log(`Token Replacer: searching for token for ${tokenCheck}`);
            console.log(`Token Replacer: searching for portrait for ${portraitCheck}`);
        }

        const filteredCachedTokens = tr_cachedTokens.filter(t => t.toLowerCase().indexOf(tokenCheck) >= 0);
        let filteredCachedPortraits = tr_cachedTokens.filter(t => t.toLowerCase().indexOf(portraitCheck) >= 0);
        filteredCachedPortraits = (filteredCachedPortraits) ?? filteredCachedTokens;
        if (!filteredCachedPortraits.length) {
            filteredCachedPortraits = filteredCachedTokens;
        }
        if (tr_isTRDebug) {
            console.log(`Token Replacer: Found these tokens: ${filteredCachedTokens}`);
            console.log(`Token Replacer: Found these portraits: ${filteredCachedPortraits}`);
        }

        data.token = data.token || {};

        // if we should replace the portrait art and the call is not from PreCreateToken.
        // we only change the art if the art is still the default mystery man
        // otherwise the portrait art will change every time we put a token on the scene
        if (
            (tr_replaceToken === 2 || tr_replaceToken === 3) &&
            (filteredCachedPortraits && filteredCachedPortraits.length > 0)
        ) {
            let randomIdx = Math.floor(Math.random() * (filteredCachedPortraits.length * filteredCachedPortraits.length));
            randomIdx = Math.floor(randomIdx / filteredCachedPortraits.length);
            const portraitSrc = filteredCachedPortraits[randomIdx];

            if (tr_isTRDebug) {
                console.log(`Token Replacer: Replacing portrait art. From: '${data.img}', To: '${portraitSrc}'`);
            }

            data.img = portraitSrc;        
        }

        // we should replace the token art
        if (
            (tr_replaceToken === 1 || tr_replaceToken === 3) &&
            (filteredCachedTokens && filteredCachedTokens.length > 0)        
        ) {
            let randomIdx = Math.floor(Math.random() * (filteredCachedTokens.length * filteredCachedTokens.length));
            randomIdx = Math.floor(randomIdx / filteredCachedTokens.length);
            const tokenSrc = filteredCachedTokens[randomIdx];

            if (tr_isTRDebug) {
                console.log(`Token Replacer: Replacing token art. From: '${data.token.img}', To: '${tokenSrc}'`);
            }

            data.token.img = tokenSrc;
        }
        
        return data;
    }
}

// initialisation
function tokenReplacerInit() {
    console.log("Token Replacer initialising...");

    // hook up events
    TokenReplacer.hookupEvents();
};

// module ready
function tokenReplacerReady() {
    // cache the tokens
    tokenReplacerCacheAvailableFiles();
};

// cache the set of available tokens which can be used to replace artwork to avoid repeated filesystem requests
async function tokenReplacerCacheAvailableFiles() {
    // grab the saved values
    TokenReplacer.grabSavedSettings();

    tr_cachedTokens = [];
    
    if (tr_isTRDebug) {
        console.log(`Token Replacer: Caching root folder: '${tr_tokenDirectory.activeSource}', '${tr_tokenDirectory.current}'`);
    }
    // any files in the root (maybe they didn't want to use subfolders)    
    const rootTokens = await FilePicker.browse(tr_tokenDirectory.activeSource, tr_tokenDirectory.current);
    rootTokens.files.forEach(t => tr_cachedTokens.push(t));

    const folders = await FilePicker.browse(tr_tokenDirectory.activeSource, tr_tokenDirectory.current);
    // any files in subfolders
	for ( let folder of folders.dirs ) {
        if (tr_isTRDebug) {
            console.log(`Token Replacer: Caching folders: '${tr_tokenDirectory.activeSource}', '${folder}'`);
        }
		const tokens = await FilePicker.browse(tr_tokenDirectory.activeSource, folder);
		tokens.files.forEach(t => tr_cachedTokens.push(t));
	}
}

async function registerTokenReplacerSettings() {
    // token replacement setting
    game.settings.register("token-replacer", "replaceToken", {
        name: game.i18n.localize("TR.ReplaceToken.Name"),
        hint: game.i18n.localize("TR.ReplaceToken.Hint"),
        scope: "world",
        config: true,
        type: Number,
        choices: {
            0: game.i18n.localize("TR.ReplaceToken.Choices.Disabled"),
            1: game.i18n.localize("TR.ReplaceToken.Choices.Token"),
            2: game.i18n.localize("TR.ReplaceToken.Choices.Portrait"),
            3: game.i18n.localize("TR.ReplaceToken.Choices.TokenPortrait"),
        },
        default: 0,
    });

    game.settings.register("token-replacer", "structure", {
        name: game.i18n.localize("TR.Structure.Name"),
        hint: game.i18n.localize("TR.Structure.Hint"),
        scope: 'world',
        type: Boolean,
        default: tr_useStructureDefault,
        config: true,
      });

    game.settings.register("token-replacer", "debug", {
        name: game.i18n.localize("TR.Debug.Name"),
        hint: game.i18n.localize("TR.Debug.Hint"),
        scope: 'world',
        type: Boolean,
        default: false,
        config: true,
      });
    
    game.settings.registerMenu("token-replacer", "setupMenu", {
        name: game.i18n.localize("TR.Settings.Name"),
        label: game.i18n.localize("TR.Settings.Name"),
        hint: game.i18n.localize("TR.Settings.Hint"),
        icon: 'fas fa-wrench',
        type: TokenReplacerSetup,
        restricted: true
      });

    // token directory
    game.settings.register("token-replacer", "tokenDirectory", {
        name: game.i18n.localize("TR.TokenDirectory.Name"),
        hint: game.i18n.localize("TR.TokenDirectory.Name"),
        scope: "world",
        config: false,
        type: DirectoryPicker.Directory,
        default: `[data] ${tr_tokenPathDefault}`,
    });

    // token subdirectory path setting
    game.settings.register("token-replacer", "difficultyName", {
        name: game.i18n.localize("TR.DifficultyName.Name"),
        hint: game.i18n.localize("TR.DifficultyName.Name"),
        scope: "world",
        config: false,
        type: String,
        default: tr_difficultyNameDefault,
    });

    game.settings.register("token-replacer", "difficultyVariable", {
        name: game.i18n.localize("TR.DifficultyVariable.Name"),
        hint: game.i18n.localize("TR.DifficultyVariable.Name"),
        scope: "world",
        config: false,
        type: String,
        default: tr_difficultyVariableDefault,
    });

    game.settings.register("token-replacer", "portraitPrefix", {
        name: game.i18n.localize("TR.PortraitPrefix.Name"),
        hint: game.i18n.localize("TR.PortraitPrefix.Name"),
        scope: "world",
        config: false,
        type: String,
        default: tr_portraitPrefixDefault,
    });

    game.settings.register("token-replacer", "imageNameFormat", {
        name: game.i18n.localize("TR.ImageNameFormat.Name"),
        hint: game.i18n.localize("TR.ImageNameFormat.Hint"),
        scope: "world",
        config: false,
        type: Number,
        choices: {
            0: game.i18n.localize("TR.ImageNameFormat.Choices.Underscored"),
            1: game.i18n.localize("TR.ImageNameFormat.Choices.Proper"),
            2: game.i18n.localize("TR.ImageNameFormat.Choices.Dashed"),            
        },
        default: 0,
    });

    game.settings.register("token-replacer", "folderNameFormat", {
        name: game.i18n.localize("TR.ImageNameFormat.Name"),
        hint: game.i18n.localize("TR.ImageNameFormat.Hint"),
        scope: "world",
        config: false,
        type: Number,
        choices: {
            0: game.i18n.localize("TR.ImageNameFormat.Choices.NoSpace"),
            1: game.i18n.localize("TR.ImageNameFormat.Choices.Underscored"),
            2: game.i18n.localize("TR.ImageNameFormat.Choices.Proper"),
            3: game.i18n.localize("TR.ImageNameFormat.Choices.Dashed"),            
        },
        default: 0,
    });

    createImageFormat(0);
    createFolderFormat(0);
}

function createImageFormat(selected) {
    tr_nameFormats = [            
        {
            name: "TR.ImageNameFormat.Choices.Underscored",
            value: "_",
            selected: false,
        },
        {
            name: "TR.ImageNameFormat.Choices.Proper",
            value: "proper",
            selected: false,
        },
        {
            name: "TR.ImageNameFormat.Choices.Dashed",
            value: "-",
            selected: false,
        }
    ];

    if (selected) {
        tr_nameFormats[selected].selected = true;
    }        
}

function createFolderFormat(selected) {
    tr_folderFormats = [
        {
            name: "TR.FolderNameFormat.Choices.NoSpace",
            value: "",
            selected: false,
        },            
        {
            name: "TR.FolderNameFormat.Choices.Underscored",
            value: "_",
            selected: false,
        },
        {
            name: "TR.FolderNameFormat.Choices.Proper",
            value: "proper",
            selected: false,
        },
        {
            name: "TR.FolderNameFormat.Choices.Dashed",
            value: "-",
            selected: false,
        }
    ];

    if (selected) {
        tr_folderFormats[selected].selected = true;
    }        
}

Handlebars.registerHelper('findSelected', function(elem, list, options) {
    if (elem) {
        return elem.find((x) => x.selected).value;
    }
    return "|Not Defined|";
});

Hooks.on("renderTokenConfig", TokenReplacerDisabler.onConfigRender);
Hooks.on("renderTokenReplacerSetup", (app, html, user) => {
    DirectoryPicker.processHtml(html);
});
Hooks.on("renderSettingsConfig", (app, html, user) => {
    DirectoryPicker.processHtml(html);
});
Hooks.once("init", tokenReplacerInit);
Hooks.once("ready", registerTokenReplacerSettings);
Hooks.on("ready", tokenReplacerReady);
