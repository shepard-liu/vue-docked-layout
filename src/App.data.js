export const testLayout1 = {
    splitSize: 5,
    floating: [
        {
            top: 20.52,
            left: 36.1,
            width: 20,
            height: 30,
            minWidth: 15,
            minHeight: 15,
            zIndex: 3,
            components: ["UserPanel"],
            activeComponent: "UserPanel",
        }, {
            top: 50,
            left: 36.1,
            width: 20,
            height: 30,
            minWidth: 15,
            minHeight: 15,
            zIndex: 2,
            components: ["PreferencesPanel"],
            activeComponent: "PreferencesPanel",
        }, {
            top: 10,
            left: 20,
            width: 20,
            height: 30,
            minWidth: 15,
            minHeight: 15,
            zIndex: 3,
            components: ["MusicPanel"],
            activeComponent: "MusicPanel",
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
};