<template>
    <span
        class="docked-layout-tab"
        ref="tab"
        :data-active="active"
        :data-dragging="dragging"
        :draggable="active"
        @dragstart="handleDragStart"
        @drag="$emit('drag', $event)"
        @dragend="handleDragEnd"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @mousedown="$emit('mouseDown', $event)"
        @mouseup="$emit('mouseUp', $event)"
        @click="$emit('click', $event)">
        <slot />
        <div
            @click="handleClickMenu"
            class="icon-menu-wrapper"
            :data-show="active">
            <IconMenu class="icon-menu" />
        </div>
        <DockedLayoutMenu
            class="tabs-menu"
            :show="showTabsMenu"
            :style="{ right: `${menuRightOffset}px` }">
            <DockedLayoutMenuItem
                v-for="item in menuItems"
                @click="$emit(item.emit)"
                :disabled="item.disabled"
                :key="item.name">
                {{ item.name }}
            </DockedLayoutMenuItem>
        </DockedLayoutMenu>
    </span>
</template>

<script>
import IconMenu from "../assets/IconMenu.vue";
import { toggleMenu } from "../utils";
import DockedLayoutMenu from "./DockedLayoutMenu.vue";
import DockedLayoutMenuItem from "./DockedLayoutMenuItem.vue";
export default {
    name: "DockedLayoutTab",
    props: {
        // 是否为激活状态
        active: Boolean,
        // 菜单操作“关闭面板组其他面板是否可用”
        canCloseOtherPanels: Boolean,
    },
    data() {
        return {
            // 是否显示菜单
            showTabsMenu: false,
            // 菜单位置
            menuRightOffset: 0,
            // 是否正在被拖动
            dragging: false,
        };
    },
    computed: {
        // 标签菜单项
        menuItems() {
            return [
                {
                    name: "关闭面板",
                    emit: "closePanel",
                },
                {
                    name: "浮动面板",
                    emit: "floatPanel",
                },
                {
                    name: "关闭面板组其他面板",
                    emit: "closeOtherPanels",
                    disabled: !this.canCloseOtherPanels,
                },
                {
                    name: "关闭面板组",
                    emit: "closePanelGroup",
                },
            ];
        },
    },
    methods: {
        // 处理激活菜单
        handleClickMenu() {
            const tabElem = this.$refs.tab,
                tabNavElem = tabElem.parentElement;
            // 将菜单右侧对齐到tab右侧，画图理解
            this.menuRightOffset =
                tabNavElem.scrollLeft +
                tabNavElem.offsetWidth -
                tabElem.offsetLeft -
                tabElem.offsetWidth;
            toggleMenu(this, "showTabsMenu");
        },
        // 处理拖动开始
        handleDragStart(event) {
            this.dragging = true;
            this.$emit("dragStart", event);
        },
        // 处理拖动结束
        handleDragEnd(event) {
            this.dragging = false;
            this.$emit("dragEnd", event);
        },
        // 处理拖动进入
        handleDragEnter(event) {},
        // 处理拖动离开
        handleDragLeave(event) {},
    },
    emits: [
        "click",
        "mouseDown",
        "mouseUp",
        "closePanel",
        "floatPanel",
        "closeOtherPanels",
        "closeAllPanels",
        "dragStart",
        "drag",
        "dragEnd",
    ],
    components: { IconMenu, DockedLayoutMenu, DockedLayoutMenuItem },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-tab {
    display: inline-flex;
    align-items: center;

    height: 100%;
    padding: 0 10px;
    background-color: rgb(216, 216, 216);
    user-select: none;
    cursor: pointer;

    &[data-active="true"] {
        background-color: rgb(183, 183, 183);
        cursor: grab;
    }

    &[data-dragging="true"] {
        opacity: 0.5;
    }
}

.icon-menu-wrapper {
    visibility: hidden;
    pointer-events: none;

    &[data-show="true"] {
        pointer-events: all;
        visibility: visible;
    }
}

.icon-menu {
    margin-left: 5px;
    height: 13px;
    width: auto;
    cursor: pointer;
}

.tabs-menu {
    position: absolute;
    top: 100%;
}
</style>