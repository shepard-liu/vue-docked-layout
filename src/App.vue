
<template>
    <main class="app">
        <DockedLayout class="main-layout" :defaultLayout="layout">
            <div slot="ToolPanel">This is ToolPanel</div>
            <div slot="PlayBackPanel">This is PlayBackPanel</div>
            <div slot="InterpPanel">This is InterpPanel</div>
            <div slot="PropertyPanel">This is PropertyPanel</div>
            <div slot="ImportPanel">This is ImportPanel</div>
            <div slot="ColorPanel">This is ColorPanel</div>
            <div slot="DocumentPanel">This is DocumentPanel</div>
            <div slot="TimelinePanel">This is TimelinePanel</div>
            <div slot="EffectsPanel">This is EffectsPanel</div>
            <div slot="UserPanel">This is UserPanel</div>
            <div slot="ExportPanel">This is ExportPanel</div>
            <div slot="CutScenePanel">This is CutScenePanel</div>
            <div slot="RendererPanel">This is RendererPanel</div>
            <div slot="LearnPanel">This is LearnPanel</div>
        </DockedLayout>
    </main>
</template>

<script>
import DockedLayout from "./components/DockedLayout.vue";
export default {
    data() {
        return {
            layout: {
                floating: [
                    {
                        top: 20.52,
                        left: 36.1,
                        width: 20,
                        height: 30,
                        minWidth: 10,
                        minHeight: 10,
                        components: ["UserPanel", "ExportPanel"],
                        activeComponent: "ExportPanel",
                    },
                ],
                orient: "v",

                children: [
                    {
                        components: ["ToolPanel"],
                        width: 10,
                        minWidth: 10,
                    },
                    {
                        orient: "h",
                        width: 90,
                        minWidth: 10,
                        children: [
                            {
                                orient: "v",
                                height: 50,
                                minHeight: 10,
                                children: [
                                    {
                                        components: ["PlayBackPanel"],
                                        width: 50,
                                        minWidth: 20,
                                    },
                                    {
                                        orient: "h",
                                        width: 50,
                                        minWidth: 20,
                                        children: [
                                            {
                                                height: 40,
                                                minHeight: 10,
                                                components: [
                                                    "InterpPanel",
                                                    "PropertyPanel",
                                                    "ImportPanel",
                                                ],
                                                activeComponent:
                                                    "PropertyPanel",
                                            },
                                            {
                                                orient: "v",
                                                height: 60,
                                                minHeight: 10,
                                                children: [
                                                    {
                                                        width: 30,
                                                        minWidth: 20,
                                                        components: [
                                                            "ColorPanel",
                                                        ],
                                                    },
                                                    {
                                                        width: 70,
                                                        minWidth: 20,
                                                        components: [
                                                            "DocumentPanel",
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                orient: "v",
                                height: 50,
                                minHeight: 10,
                                children: [
                                    {
                                        width: 20,
                                        minWidth: 20,
                                        components: [
                                            "TimelinePanel",
                                            "EffectsPanel",
                                        ],
                                    },
                                    {
                                        minWidth: 20,
                                        width: 20,
                                        components: ["CutScenePanel"],
                                    },
                                    {
                                        minWidth: 20,
                                        width: 20,
                                        components: ["RendererPanel"],
                                    },
                                    {
                                        minWidth: 20,
                                        width: 40,
                                        components: ["LearnPanel"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };
    },
    components: { DockedLayout },
};
</script>

<style>
html {
    height: 100%;
}

body {
    min-height: 100%;
}

html,
body {
    padding: 0;
    margin: 0;
}

.app {
    width: 100vw;
    height: 100vh;
}

.main-layout {
    height: 100%;
    width: 100%;
}
</style>
