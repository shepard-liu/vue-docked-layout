<template>
    <div
        class="docked-layout-menu-item"
        :data-active="active"
        :data-disabled="disabled"
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
    emits: ["click"],
};
</script>

<style scoped lang="scss">
.docked-layout-menu-item {
    padding: 5px 0;
    font-size: 12px;
    cursor: pointer;

    &[data-active="true"] {
        font-weight: bold;
        cursor: auto;
    }

    &[data-disabled="true"] {
        cursor: auto;
        font-weight: normal;
        color: gray;
    }
}
</style>