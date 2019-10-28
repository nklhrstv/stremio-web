const React = require('react');
const { useServices } = require('stremio/services');

const DEFAULT_TYPE = 'movie';
const DEFAULT_CATEGORY = 'thirdparty';

const useAddons = (urlParams, queryParams) => {
    const { core } = useServices();
    const [addons, setAddons] = React.useState([[], []]);
    const installAddon = React.useCallback(descriptor =>
        core.dispatch({
            action: 'AddonOp',
            args: {
                addonOp: 'Install',
                args: descriptor
            }
        }), []);
    const uninstallAddon = React.useCallback(descriptor =>
        core.dispatch({
            action: 'AddonOp',
            args: {
                addonOp: 'Remove',
                args: {
                    transport_url: descriptor.transportUrl
                }
            }
        }), []);
    React.useEffect(() => {
        const type = typeof urlParams.type === 'string' && urlParams.type.length > 0 ? urlParams.type : DEFAULT_TYPE;
        const category = typeof urlParams.category === 'string' && urlParams.category.length > 0 ? urlParams.category : DEFAULT_CATEGORY;
        const onNewState = () => {
            const state = core.getState();
            const myAddons = [...new Set(
                [].concat(...state.ctx.content.addons.map(addon => addon.manifest.types))
            )]
                .map((type) => (
                    {
                        is_selected: urlParams.category === 'my',
                        name: 'my',
                        load: {
                            base: 'https://v3-cinemeta.strem.io/manifest.json',
                            path: {
                                resource: 'addon_catalog',
                                type_name: type,
                                id: 'my',
                                extra: []
                            }
                        }
                    })
                );
            myAddons.forEach(addon => state.addons.catalogs.push(addon));
            const selectInputs = [
                {
                    'data-name': 'type',
                    selected: state.addons.types
                        .filter(({ is_selected }) => is_selected)
                        .map(({ load }) => JSON.stringify(load)),
                    options: state.addons.types
                        .map(({ type_name, load }) => ({
                            value: JSON.stringify(load),
                            label: type_name
                        })),
                    onSelect: (event) => {
                        const load = JSON.parse(event.reactEvent.currentTarget.dataset.value);
                        window.location = `#/addons/${encodeURIComponent(load.path.type_name)}/${encodeURIComponent(load.path.id)}`;
                    }
                },
                {
                    'data-name': 'category',
                    selected: state.addons.catalogs
                        .filter(({ is_selected }) => is_selected)
                        .map(({ load }) => JSON.stringify(load)),
                    options: state.addons.catalogs
                        .filter(({ load: { path: { type_name } } }) => {
                            return type_name === type;
                        })
                        .map(({ name, load }) => ({
                            value: JSON.stringify(load),
                            label: name
                        })),
                    onSelect: (event) => {
                        const load = JSON.parse(event.reactEvent.currentTarget.dataset.value);
                        window.location = `#/addons/${encodeURIComponent(load.path.type_name)}/${encodeURIComponent(load.path.id)}`
                    }
                }
            ];
            const installedAddons = state.ctx.is_loaded ? state.ctx.content.addons : [];
            const addonsItems = urlParams.category === 'my' && state.ctx.is_loaded ?
                installedAddons.filter(addon => addon.manifest.types.includes(urlParams.type))
                :
                (state.addons.content.type === 'Ready' ? state.addons.content.content : []);
            setAddons([addonsItems, selectInputs, installAddon, uninstallAddon, installedAddons]);
        };
        core.on('NewModel', onNewState);
        core.dispatch({
            action: 'Load',
            args: {
                load: 'CatalogFiltered',
                args: {
                    base: 'https://v3-cinemeta.strem.io/manifest.json',
                    path: {
                        resource: 'addon_catalog',
                        type_name: type,
                        id: category,
                        extra: [] // TODO
                    }
                }
            }
        });
        return () => {
            core.off('NewModel', onNewState);
        };
    }, [urlParams, queryParams]);
    return addons;
};

module.exports = useAddons;
