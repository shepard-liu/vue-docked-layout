<template>
    <div class="docked-layout-tab-panel">
        <div class="tab-nav-wrapper">
            <div class="tab-nav" ref="tabNav" @wheel="handleScrollTabNav">
                <DockedLayoutTab
                    v-for="(tabName, index) in components"
                    class="tab"
                    :active="tabName === currentTab"
                    @closePanel="
                        $emit('closePanel', { component: tabName, index })
                    "
                    @closeOtherPanels="
                        $emit('closeOtherPanels', { component: tabName, index })
                    "
                    @closePanelGroup="$emit('closePanelGroup')"
                    @floatPanel="
                        $emit('floatPanel', { component: tabName, index })
                    "
                    @dragStart="
                        handlePanelDragStart(
                            { component: tabName, index },
                            $event
                        )
                    "
                    @drop="
                        $emit(
                            'panelDrop',
                            {
                                dropComponentIndex: index,
                                dropComponent: tabName,
                            },
                            $event
                        )
                    "
                    @mouseDown="switchTab(index)"
                    :canCloseOtherPanels="components.length > 1"
                    :key="tabName">
                    {{ tabName }}
                </DockedLayoutTab>
                <div
                    class="more-btn"
                    @click="handleClickMoreBtn"
                    v-show="showMoreBtn">
                    <IconDropdown class="more-btn-icon" />
                </div>
            </div>

            <DockedLayoutMenu :show="showTabsMenu" class="tabs-menu">
                <DockedLayoutMenuItem
                    v-for="(tabName, index) in components"
                    @click="switchTab(index)"
                    :active="tabName === currentTab"
                    :key="tabName">
                    {{ tabName }}
                </DockedLayoutMenuItem>
            </DockedLayoutMenu>
        </div>
        <div class="tab-content">
            <slot :name="currentTab"></slot>
        </div>
    </div>
</template>

<script>
import DockedLayoutTab from "./DockedLayoutTab.vue";
import IconDropdown from "../assets/IconDropdown.vue";
import DockedLayoutMenu from "./DockedLayoutMenu.vue";
import DockedLayoutMenuItem from "./DockedLayoutMenuItem.vue";
import { toggleMenu } from "../utils";
export default {
    name: "DockedLayoutTabPanel",
    props: {
        // 当前激活的组件名
        activeComponent: String,
        // 组件列表
        components: {
            type: Array,
            required: true,
        },
    },
    components: {
        DockedLayoutTab,
        IconDropdown,
        DockedLayoutMenu,
        DockedLayoutMenuItem,
    },
    data() {
        return {
            // 是否在tab导航栏显示更多按钮
            showMoreBtn: false,
            // 是否显示更多菜单
            showTabsMenu: false,
        };
    },
    computed: {
        currentTab() {
            return this.activeComponent || this.components[0];
        },
    },
    methods: {
        // 切换当前激活的标签
        switchTab(index) {
            if (this.components[index] === this.currentTab) return;
            this.$emit("activeChange", this.components[index]);
        },
        // 处理滚动标签页导航事件
        handleScrollTabNav(event) {
            // 将垂直滚动映射为水平滚动
            this.$refs.tabNav.scrollBy({ left: event.deltaY / 10 });
        },
        // 处理单击更多按钮事件
        handleClickMoreBtn() {
            toggleMenu(this, "showTabsMenu");
        },
        // 窗口尺寸改变事件监听器
        updateMoreButtonVisibility() {
            const tabNavElem = this.$refs.tabNav;
            this.showMoreBtn = tabNavElem.scrollWidth > tabNavElem.clientWidth;
        },
        // 拖动面板Tab标签开始事件
        handlePanelDragStart({ component, index }, event) {
            this.$emit("panelDragStart", { component, index }, event);
        },
    },
    mounted() {
        window.addEventListener("resize", this.updateMoreButtonVisibility);
    },
    updated() {
        this.updateMoreButtonVisibility();
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updateMoreButtonVisibility);
    },
    emits: [
        "activeChange",
        "closePanel",
        "closeOtherPanels",
        "closePanelGroup",
        "floatPanel",
        "panelDragStart",
        "panelDrop",
    ],
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-tab-panel {
    display: flex;
    flex-direction: column;
}

.tab-nav-wrapper {
    height: 30px;

    // 为菜单提供定位参考
    position: relative;
}

.tab-nav {
    background-color: rgb(231, 231, 231);
    overflow-x: auto;
    white-space: nowrap;
    height: 100%;

    // 隐藏滑动条
    &::-webkit-scrollbar {
        display: none;
    }
}

.more-btn {
    // 将更多按钮定位到滑动区域右侧固定
    position: sticky;
    right: 0;

    // 居中渲染内部的下拉按钮图标
    display: inline-flex;
    justify-content: center;
    align-items: center;

    background-color: rgb(118, 118, 118);
    height: 100%;
    width: 25px;
    vertical-align: top;
    color: white;
    cursor: pointer;
}

.more-btn-icon {
    width: 16px;
    height: 20px;
}

.tabs-menu {
    position: absolute;
    z-index: 1;
    top: 100%;
    right: 0;
}

.tab-content {
    flex: 1;
    overflow: hidden;
}
</style>