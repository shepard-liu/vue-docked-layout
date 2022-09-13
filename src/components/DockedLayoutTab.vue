<template>
    <div
        class="docked-layout-tab"
        ref="tab"
        :data-active="active"
        :data-dragging="dragging"
        :data-drag-over="dragOver"
        :draggable="active"
        @dragstart="handleDragStart"
        @drag="$emit('drag', $event)"
        @dragend="handleDragEnd"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
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
            :show="showTabsMenu && !dragging"
            :style="{ right: `${menuRightOffset}px` }">
            <DockedLayoutMenuItem
                v-for="item in menuItems"
                @mouseDown="$emit(item.emit)"
                :disabled="item.disabled"
                :key="item.name">
                {{ item.name }}
            </DockedLayoutMenuItem>
        </DockedLayoutMenu>
    </div>
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
            // 是否有其他面板页签进入本页签的位置
            dragOver: false,
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
            event.dataTransfer.effectAllowed = "move";
            this.$emit("dragStart", event);
        },
        // 处理拖动结束
        handleDragEnd(event) {
            this.dragging = false;
            this.$emit("dragEnd", event);
        },
        // 处理拖动进入
        handleDragEnter(event) {
            if (this.dragging === true) return;

            this.dragOver = true;
            this.$emit("dragEnter", event);
        },
        // 处理拖动离开
        handleDragLeave(event) {
            if (this.dragging === true) return;

            this.dragOver = false;
            this.$emit("dragLeave", event);
        },
        // 处理拖动悬浮
        handleDragOver(event) {
            if (this.dragging === true) return;

            event.preventDefault();
            event.dataTransfer.dropEffect = "move";

            this.$emit("dragOver", event);
        },
        // 处理拖动放置事件
        handleDrop(event) {
            this.dragOver = false;

            if (this.dragging === true || !this.validatePanelDndDataType(event))
                return;

            event.preventDefault();

            this.$emit("drop", event);
        },
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
        "dragEnter",
        "dragLeave",
        "dragOver",
        "drop",
    ],
    components: { IconMenu, DockedLayoutMenu, DockedLayoutMenuItem },
    inject: {
        validatePanelDndDataType: "validatePanelDndDataType",
    },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-tab {
    display: flex;
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

    &[data-drag-over="true"] {
        background-color: gray;

        & .icon-menu-wrapper {
            // 拖拽时遇到子元素会触发dragLeave事件，还有一种解决方案
            // @see https://stackoverflow.com/questions/7110353/html5-dragleave-fired-when-hovering-a-child-element
            pointer-events: none;
        }
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
    z-index: 99999;
    top: 100%;
}
</style>