<template>
    <div
        class="docked-layout-menu-item"
        :data-active="active"
        :data-disabled="disabled"
        @mousedown="$emit('mouseDown', $event)"
        @click="$emit('click', $event)">
        <slot />
    </div>
</template>

<script>
export default {
    name: "DockedLayoutMenuItem",
    props: {
        // 是否为激活状态
        active: Boolean,
        // 是否停用
        disabled: Boolean,
    },
    emits: ["click", "mouseDown"],
};
</script>

<style scoped lang="scss">
.docked-layout-menu-item {
    padding: 8px 0;
    font-size: 12px;

    text-align: center;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    cursor: pointer;

    &[data-disabled="true"] {
        cursor: auto;
        font-weight: normal;
        color: gray;
    }

    &:hover {
        background: #e4ebff;
    }

    &[data-active="true"] {
        cursor: auto;
        background: #4f68ac;
        color: white;
    }
}
</style>