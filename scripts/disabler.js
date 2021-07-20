// Token Config
export const TokenReplacerDisabler = {
    getReplacerDisabled: function(token) {
        return token.getFlag('token-replacer', 'disabled');
    },

    onConfigRender: function(config, html) {
		const disabled = TokenReplacerDisabler.getReplacerDisabled(config.token);
		const imageTab = html.find('.tab[data-tab="image"]');

		imageTab.append($(`
			<fieldset class="token-replacer">
				<legend>${game.i18n.localize('TR.TokenConfig.Heading')}</legend>
                <label class="checkbox">
                    <input type="checkbox" name="flags.token-replacer.disabled"
                            ${disabled ? 'checked' : ''}>
                    ${game.i18n.localize('TR.TokenConfig.Disable')}
                </label>			
			</fieldset>
		`));
	}
}