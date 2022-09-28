<template>
    <div class="docked-layout-tab-panel">
        <div class="tab-nav-wrapper">
            <div class="tab-nav" ref="tabNav" @wheel="handleScrollTabNav">
                <DockedLayoutTab
                    v-for="(tabName, index) in components"
                    class="tab"
                    :active="tabName === currentTab"
                    :floating="floating"
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
                            'panelDropOnNav',
                            {
                                dropComponentIndex: index,
                                dropComponent: tabName,
                            },
                            $event
                        )
                    "
                    @mouseDown="switchTab(index)"
                    :canCloseOtherPanels="components.length > 1"
                    :key="tabName"
                >
                    {{ tabName }}
                </DockedLayoutTab>
                <!-- 占据面板导航栏剩余空间（若有）的元素，用作尾部拖放区 -->
                <div
                    class="nav-drop-area"
                    :data-drag-over="navDragOver"
                    @dragenter="handleNavDragEnter"
                    @dragover="handleNavDragOver"
                    @drop="handleNavDrop"
                    @dragleave="handleNavDragLeave"
                ></div>
                <!-- 激活面板选择按钮 -->
                <div
                    class="more-btn"
                    @mousedown="$event.stopPropagation()"
                    @click="handleClickMoreBtn"
                    v-show="showMoreBtn"
                >
                    <IconDropdown class="more-btn-icon" />
                </div>
            </div>
            <!-- 激活面板选择菜单 -->
            <DockedLayoutMenu :show="showTabsMenu" class="tabs-menu">
                <DockedLayoutMenuItem
                    v-for="(tabName, index) in components"
                    @mouseDown="switchTab(index)"
                    :active="tabName === currentTab"
                    :key="tabName"
                >
                    {{ tabName }}
                </DockedLayoutMenuItem>
            </DockedLayoutMenu>
        </div>
        <!-- 面板内容区 -->
        <div
            class="tab-content"
            ref="tabContent"
            @dragenter="++contentDragCounter"
            @dragleave="--contentDragCounter"
        >
            <!-- 停靠操作面板 -->
            <template v-if="contentDragCounter > 0">
                <div
                    v-for="area in dockActionPaneAreas"
                    :class="area.className"
                    :data-drag-over="currentDndPointerArea === area.name"
                    @dragenter="
                        ++contentDragCounter;
                        currentDndPointerArea = area.name;
                    "
                    @dragleave="--contentDragCounter"
                    @dragover="handleDockAreaDragOver"
                    @drop="handleDockAreaDrop(area.name, $event)"
                />
            </template>
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
import { draggingPanel } from "./common.data";
import lodash from "lodash";

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
        // 是否为浮动结点下的面板
        floating: Boolean,
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
            // 导航条拖放悬浮
            navDragOver: false,
            /**
             * 内容区拖放进出计数器
             *
             * 该变量在内容区停靠操作面板元素及子元素上每次拖放进入(dragEnter)时+1，
             * 在每次拖放离开(dragLeave)时-1。
             * 计数器不为0时，显示停靠操作面板。
             */
            contentDragCounter: 0,
            // 当前拖放指针所在的停靠操作区域
            currentDndPointerArea: null,
            // 导航栏resize观察者
            tabNavResizeOb: null,
        };
    },
    computed: {
        currentTab() {
            return this.activeComponent || this.components[0];
        },
        // 停靠面板操作区类名列表
        dockActionPaneAreas() {
            return this.floating
                ? [
                      {
                          className: "dock-into dock-into--floating",
                          name: "center",
                      },
                  ]
                : [
                      // "向左停靠面板"拖放区域
                      {
                          className: "dock-left",
                          name: "left",
                      },
                      // "向右停靠面板"拖放区域
                      {
                          className: "dock-right",
                          name: "right",
                      },
                      // "向上停靠面板"拖放区域
                      {
                          className: "dock-above",
                          name: "above",
                      },
                      // "向下停靠面板"拖放区域
                      {
                          className: "dock-below",
                          name: "below",
                      },
                      // "停入面板"拖放区域
                      {
                          className: "dock-into",
                          name: "center",
                      },
                  ];
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
        // 处理导航条拖放进入
        handleNavDragEnter() {
            this.navDragOver = true;
        },
        // 处理导航条拖放离开
        handleNavDragLeave() {
            this.navDragOver = false;
        },
        // 处理导航条拖放悬浮
        handleNavDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        },
        // 处理导航条放置
        handleNavDrop(event) {
            this.navDragOver = false;

            if (!this.validatePanelDndDataType(event)) return;

            this.$emit(
                "panelDropOnNav",
                {
                    dropComponentIndex: this.components.length,
                    dropComponent: null,
                },
                event
            );
        },
        // 处理停靠区域拖放悬浮
        handleDockAreaDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        },
        // 处理停靠区域放置
        handleDockAreaDrop(area, event) {
            this.contentDragCounter = 0;
            this.currentDndPointerArea = null;

            this.$emit("panelDropOnDockActionPane", area, event);
        },
    },
    mounted() {
        window.addEventListener("resize", this.updateMoreButtonVisibility);
        this.tabNavResizeOb = new ResizeObserver(() => {
            this.updateMoreButtonVisibility();
        });
        this.tabNavResizeOb.observe(this.$refs.tabNav);
    },
    updated() {
        this.updateMoreButtonVisibility();
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updateMoreButtonVisibility);
        this.tabNavResizeOb.disconnect();
    },
    emits: [
        "activeChange",
        "closePanel",
        "closeOtherPanels",
        "closePanelGroup",
        "floatPanel",
        "panelDragStart",
        "panelDropOnNav",
        "panelDropOnContent",
        "panelDropOnDockActionPane",
    ],
    inject: {
        validatePanelDndDataType: "validatePanelDndDataType",
    },
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
    display: flex;

    background-color: rgb(231, 231, 231);
    overflow-x: auto;
    white-space: nowrap;
    height: 100%;

    // 隐藏滑动条
    &::-webkit-scrollbar {
        display: none;
    }
}

.nav-drop-area {
    height: 100%;
    // 占据剩余空间(若有)
    flex: 1;

    // 拖放悬浮时
    &[data-drag-over="true"] {
        background-color: rgb(160, 160, 160);
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
    padding: 5px;
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
    position: relative;
}

@keyframes dockedAreaDragOverBreath {
    0% {
        transform: none;
        opacity: 0.2;
    }
    50% {
        transform: scale(1.1);
        opacity: 0;
    }
    100% {
        transform: none;
        opacity: 0.2;
    }
}

@mixin dockAreaMixin($orient: NULL) {
    position: absolute;
    z-index: 99999; // 显示在面板内容之前
    opacity: 0.2;

    @if $orient == "v" {
        width: 25%;
        height: 100%;
    } @else if $orient == "h" {
        width: 100%;
        height: 25%;
    }

    &[data-drag-over="true"] {
        animation: dockedAreaDragOverBreath 800ms infinite;
    }
}
// 向上停靠区
.dock-above {
    @include dockAreaMixin($orient: "h");
    clip-path: polygon(0 0, 100% 0, 75% 100%, 25% 100%);
    background: rgb(15, 20, 91);
    top: 0;
    left: 0;
}

// 向下停靠区
.dock-below {
    @include dockAreaMixin($orient: "h");
    clip-path: polygon(25% 0, 75% 0, 100% 100%, 0 100%);
    background: rgb(15, 91, 38);
    bottom: 0;
    left: 0;
}

// 向右停靠区

.dock-right {
    @include dockAreaMixin($orient: "v");
    clip-path: polygon(0 25%, 100% 0, 100% 100%, 0 75%);
    background: rgb(91, 15, 28);
    right: 0;
    top: 0;
}

// 向左停靠区
.dock-left {
    @include dockAreaMixin($orient: "v");
    clip-path: polygon(0 0, 100% 25%, 100% 75%, 0 100%);
    background: rgb(91, 43, 15);

    left: 0;
    top: 0;
}

// 停入面板停靠区
.dock-into {
    @include dockAreaMixin();
    background: rgb(83, 83, 83);
    width: 50%;
    height: 50%;
    top: 25%;
    left: 25%;
}

.dock-into--floating {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}
</style>