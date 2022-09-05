<template>
    <div class="docked-layout-menu" v-show="show">
        <div class="item-wrapper" v-for="(item, index) in getAllChildVNodes()" :key="item.key || getNextId()">
            <VNodes :vnodes="item" />
        </div>
    </div>
</template>

<script>
import { uniqueId } from '../utils/uniqueId';
const nextId = uniqueId('__docked_layout_menu_');

export default {
    name: 'DockedLayoutMenu',
    props: {
        show: Boolean,
    },
    methods: {
        getNextId() {
            return nextId();
        },
        getAllChildVNodes() {
            // 取出所有槽中的组件，$slots没有被纳入reactivity
            return Object.values(this.$slots).flat();
        }
    },
    components: {
        // 直接渲染vnode的组件
        VNodes: {
            functional: true,
            render: (_, ctx) => ctx.props.vnodes
        }
    }
}
</script>

<style scoped lang="scss">
.docked-layout-menu {
    background-color: rgb(232, 232, 232);
    user-select: none;
    padding: 5px 10px;
}

.item-wrapper {

    &:not(:last-child) {
        border-bottom: 1px solid gray;
    }
}
</style>