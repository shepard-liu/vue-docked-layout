
<template>
    <main class="app">
        <DockedLayout
            class="main-layout"
            :layout="layout"
            @layoutChange="handleLayoutChange">
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
            <div slot="PreferencesPanel">This is PreferencesPanel</div>
            <div slot="MusicPanel">This is MusicPanel</div>
            <div slot="ExportPanel">This is ExportPanel</div>
            <div slot="CutScenePanel">This is CutScenePanel</div>
            <div slot="RendererPanel">This is RendererPanel</div>
            <div slot="LearnPanel">This is LearnPanel</div>
        </DockedLayout>
    </main>
</template>

<script>
import DockedLayout from "./components/DockedLayout.vue";
import { testLayout1 } from "./App.data";
export default {
    components: { DockedLayout },
    data() {
        return {
            layout: testLayout1,
        };
    },
    methods: {
        handleLayoutChange(layout) {
            this.layout = layout;
        },
    },
};
</script>

<style>
* {
    box-sizing: border-box;
}
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
    background: #7494ec;
}

.app {
    width: 100vw;
    height: 100vh;
    padding: 10px;
}

.main-layout {
    height: 100%;
    width: 100%;
}
</style>
