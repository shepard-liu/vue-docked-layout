<template>
    <div
        class="docked-layout-tab"
        ref="tab"
        :data-drag-over="dragOver"
        :data-active="active"
        :data-dragging="dragging"
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
            @mousedown="$event.stopPropagation()"
            @click="handleClickMenu"
            class="icon-menu-wrapper"
            :data-show="active">
            <IconMenu class="icon-menu" />
        </div>
        <DockedLayoutMenu
            class="tab-menu"
            :show="showTabMenu && !dragging"
            :style="{ right: `${menuRightOffset}px` }">
            <template v-for="item in menuItems">
                <DockedLayoutMenuItem
                    v-if="item.type === 'menu-item'"
                    class="menu-item"
                    @mouseDown="handleMenuItemMouseDown(item)"
                    :disabled="item.disabled">
                    <component
                        v-if="item.icon"
                        class="menu-icon"
                        :is="menuIcon(item.icon)" />
                    <span>
                        {{ item.name }}
                    </span>
                </DockedLayoutMenuItem>
                <div v-else class="menu-item-sep"></div>
            </template>
        </DockedLayoutMenu>
    </div>
</template>

<script>
import IconPinned from "../assets/IconPinned.vue";
import IconUnpinned from "../assets/IconUnpinned.vue";
import IconMenu from "../assets/IconMenu.vue";
import { toggleMenu } from "../utils";
import DockedLayoutMenu from "./DockedLayoutMenu.vue";
import DockedLayoutMenuItem from "./DockedLayoutMenuItem.vue";
export default {
    name: "DockedLayoutTab",
    components: {
        IconPinned,
        IconUnpinned,
    },
    props: {
        // ?????????????????????
        active: Boolean,
        // ?????????????????????????????????????????????????????????
        canCloseOtherPanels: Boolean,
        // ????????????????????????tab
        floating: Boolean,
        // ??????????????????????????????????????????
        autoHideTabNav: Boolean,
    },
    data() {
        return {
            // ??????????????????
            showTabMenu: false,
            // ????????????
            menuRightOffset: 0,
            // ?????????????????????
            dragging: false,
            // ???????????????????????????????????????????????????
            dragOver: false,
        };
    },
    computed: {
        // ???????????????
        menuItems() {
            return [
                {
                    name: "????????????",
                    type: "menu-item",
                    emitMessage: "closePanel",
                },
                {
                    name: "????????????",
                    type: "menu-item",
                    emitMessage: "floatPanel",
                    disabled: this.floating,
                },
                {
                    name: "???????????????????????????",
                    type: "menu-item",
                    emitMessage: "closeOtherPanels",
                    disabled: !this.canCloseOtherPanels,
                },
                {
                    name: "???????????????",
                    type: "menu-item",
                    emitMessage: "closePanelGroup",
                },
                {
                    type: "seperator",
                },
                {
                    name: this.autoHideTabNav
                        ? "?????????????????????"
                        : "?????????????????????",
                    type: "menu-item",
                    emitMessage: "toggleAutoHideTabNav",
                    icon: this.autoHideTabNav ? "IconUnpinned" : "IconPinned",
                },
            ];
        },
    },
    methods: {
        // ???????????????
        menuIcon(name) {
            return {
                IconPinned,
                IconUnpinned,
            }[name];
        },
        // ??????????????????
        handleClickMenu() {
            const tabElem = this.$refs.tab,
                tabNavElem = tabElem.parentElement;
            // ????????????????????????tab?????????????????????
            this.menuRightOffset =
                tabNavElem.scrollLeft +
                tabNavElem.offsetWidth -
                tabElem.offsetLeft -
                tabElem.offsetWidth;
            toggleMenu(this, "showTabMenu");
        },
        // ?????????????????????
        handleMenuItemMouseDown({ disabled, emitMessage }) {
            if (!disabled) this.$emit(emitMessage);
        },
        // ??????????????????
        handleDragStart(event) {
            this.dragging = true;
            event.dataTransfer.effectAllowed = "move";
            this.$emit("dragStart", event);
            this.enablePanelInteraction(false);

            const dropListener = () => {
                this.enablePanelInteraction(true);
                document.removeEventListener("drop", dropListener);
            };

            document.addEventListener("drop", dropListener);
        },
        // ??????????????????
        handleDragEnd(event) {
            this.dragging = false;
            this.$emit("dragEnd", event);
            this.enablePanelInteraction(true);
        },
        // ??????????????????
        handleDragEnter(event) {
            if (this.dragging === true) return;

            this.dragOver = true;
            this.$emit("dragEnter", event);
        },
        // ??????????????????
        handleDragLeave(event) {
            if (this.dragging === true) return;

            this.dragOver = false;
            this.$emit("dragLeave", event);
        },
        // ??????????????????
        handleDragOver(event) {
            if (this.dragging === true) return;

            event.preventDefault();
            event.dataTransfer.dropEffect = "move";

            this.$emit("dragOver", event);
        },
        // ????????????????????????
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
        "toggleAutoHideTabNav",
    ],
    components: { IconMenu, DockedLayoutMenu, DockedLayoutMenuItem },
    inject: {
        validatePanelDndDataType: "validatePanelDndDataType",
        enablePanelInteraction: "enablePanelInteraction",
    },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-tab {
    display: flex;
    align-items: center;
    color: #4f68ac;
    height: 100%;
    padding: 0 10px;
    font-size: 12px;

    background: #e2e9ff;
    user-select: none;
    cursor: pointer;

    &[data-dragging="true"] {
        opacity: 0.5;
    }

    &[data-drag-over="true"] {
        background: #b8caff;

        & .icon-menu-wrapper {
            // ?????????????????????????????????dragLeave?????????????????????????????????
            // @see https://stackoverflow.com/questions/7110353/html5-dragleave-fired-when-hovering-a-child-element
            pointer-events: none;
        }
    }

    &[data-active="true"]:not([data-drag-over="true"]) {
        background: linear-gradient(180deg, #e0e8fd 0%, #c9d7fd 100%);
        cursor: grab;
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
    margin-left: 10px;
    height: 10px;
    width: auto;
    cursor: pointer;
}

.tab-menu {
    position: absolute;
    z-index: 99999;
    top: 100%;
    width: 120px;
    border-radius: 0px 0px 10px 10px;
    max-height: 200px;
    background: #f7f9ff;
    box-shadow: 1px 3px 10px 4px rgba(172, 188, 231, 0.3);
}

.menu-icon {
    height: 12px;
    width: auto;
    position: relative;
    top: 1px;
}

.menu-item-sep {
    height: 1px;
    background: #516bb9;
    width: 85%;
    margin: auto;
}
</style>