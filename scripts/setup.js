export {TokenReplacerSetup}

// Token Replacer Setup Menu
class TokenReplacerSetup extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "token-replacer-settings";
        options.template = "modules/token-replacer/handlebars/settings.handlebars";
        options.width = 500;
        return options;
    }    
  
    get title() { 
         "Token Replacer Settings";
    }
  
    /** @override */
    async getData() {
        const tokenDir = game.settings.get("token-replacer", "tokenDirectory");
        const diffName = game.settings.get("token-replacer", "difficultyName");
        const diffVariable = game.settings.get("token-replacer", "difficultyVariable");
        const prefix = game.settings.get("token-replacer", "portraitPrefix");

        // file name formats
        let imgNameFormat = game.settings.get("token-replacer", "imageNameFormat");        
        if (imgNameFormat === null || imgNameFormat === -1) {
            imgNameFormat = 0;
        }
        if (imgNameFormat !== null && imgNameFormat > -1) {
            tr_nameFormats[imgNameFormat].selected = true;
        }

        // folder name formats
        let folderNameFormat = game.settings.get("token-replacer", "folderNameFormat");        
        if (folderNameFormat === null || folderNameFormat === -1) {
            folderNameFormat = 0;
        }
        if (folderNameFormat !== null && folderNameFormat > -1) {
            tr_folderFormats[folderNameFormat].selected = true;
        }

        const useDefinedStructures = game.settings.get("token-replacer", "structure");

        const dataDirSet = !tr_BAD_DIRS.includes(tokenDir);

        const setupConfig = {
            "tokenDirectory": tokenDir,
            "difficultyName": diffName,
            "difficultyVariable": diffVariable,
            "portraitPrefix": prefix,
            "nameFormats": tr_nameFormats,
            "folderFormats": tr_folderFormats,
            "useDefinedStructures": useDefinedStructures
        };

        let diffSpecified = true;
        if (diffName !== "" && diffVariable === "") {
            diffSpecified = false;
        }
        
        const setupComplete = dataDirSet && diffSpecified;

        return {
            setupConfig: setupConfig,
            setupComplete: setupComplete,
        };
    }
  
    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();

        const tokenDir = formData['token-directory'];
        const diffName = formData['difficulty-name'];
        let diffVariable = formData['difficulty-variable'];
        const prefix = formData['portrait-prefix'];

        // can’t be const because it’s overwritten for debug logging
        let imageNameFormat = formData['image-name-format'];
        const imageNameIdx = tr_nameFormats.findIndex(x => x.value === imageNameFormat);
        tr_nameFormats.forEach((x) => {
            x.selected = false;
        });
        if (imageNameIdx !== null && imageNameIdx > -1 && tr_nameFormats[imageNameIdx]) {
            tr_nameFormats[imageNameIdx].selected = true;
        }

        let folderNameFormat = formData['folder-name-format'];
        const folderNameIdx = tr_folderFormats.findIndex(x => x.value === folderNameFormat);
        tr_folderFormats.forEach((x) => {
            x.selected = false;
        });
        if (folderNameIdx !== null && folderNameIdx > -1) {
            tr_folderFormats[folderNameIdx].selected = true;
        }

        // if not difficulty name is specified then the variable is not needed
        if (diffName === "") {
            diffVariable = "";
        }

        await game.settings.set("token-replacer", "tokenDirectory", tokenDir);
        await game.settings.set("token-replacer", "difficultyName", diffName);
        await game.settings.set("token-replacer", "difficultyVariable", diffVariable);
        await game.settings.set("token-replacer", "portraitPrefix", prefix);
        await game.settings.set("token-replacer", "imageNameFormat", imageNameIdx);
        await game.settings.set("token-replacer", "folderNameFormat", folderNameIdx);

        const isTRDebug = game.settings.get("token-replacer", "debug");
        if (isTRDebug) {
            if (folderNameFormat === "proper") {
                folderNameFormat = " ";
            }
            if (imageNameFormat === "proper") {
                imageNameFormat = " ";
            }
            console.log(`Token Replacer: Format Structure Setup: '${tr_tokenDirectory.activeSource}/${tr_tokenDirectory.current}/${diffName}${folderNameFormat}0_25/Monster${imageNameFormat}Name.png'`);
        }

        const tokenDirSet = !tr_BAD_DIRS.includes(tokenDir);

        if (!tokenDirSet) {
            $('#setup-feedback').text(`Please set the token directory to something other than the root.`);
            $('#token-replacer-settings').css("height", "auto");
            throw new Error(`Please set the token directory to something other than the root.`);
        } else if (diffName !== "" && diffVariable === "") {
            $('#setup-feedback').text(`If there is a 'Difficulty Name', you NEED to specify the 'Difficulty Variable'.`);
            $('#ddb-importer-settings').css("height", "auto");
            throw new Error(`If there is a 'Difficulty Name', you NEED to specify the 'Difficulty Variable'.`);
        } else {
            // recache the tokens
            tokenReplacerCacheAvailableFiles();
        }
    }
}