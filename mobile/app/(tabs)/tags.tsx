import React, { useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput, Modal,
    ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../providers/theme-provider";
import { tagsAPI, type Tag, type CreateTagData } from "../../services/api";

const TAG_COLORS = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
    "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
    "#06B6D4", "#84CC16",
];

function TagCard({ tag, onEdit, onDelete }: { tag: Tag; onEdit: (tag: Tag) => void; onDelete: (id: string) => void }) {
    return (
        <View className="bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 mb-3 mx-5 flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: tag.color + "25" }}>
                <View className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
            </View>
            <View className="flex-1">
                <Text className="text-black dark:text-white font-semibold text-sm">{tag.name}</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{tag._count?.transactions || 0} transactions</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(tag)} className="bg-neutral-100 dark:bg-neutral-600 rounded-xl p-2.5 mr-2">
                <Text className="text-xs">✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => {
                    Alert.alert("Delete Tag", `Delete "${tag.name}"?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => onDelete(tag.id) },
                    ]);
                }}
                className="bg-danger-500/10 rounded-xl p-2.5"
            >
                <Text className="text-xs">🗑️</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function Tags() {
    const queryClient = useQueryClient();
    const { isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState(TAG_COLORS[0]);

    const { data: tags, isLoading, refetch, isRefetching } = useQuery<Tag[]>({
        queryKey: ["tags"],
        queryFn: async () => { const res = await tagsAPI.getAll(); return res.data; },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateTagData) => tagsAPI.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tags"] }); closeModal(); },
        onError: (error: any) => { Alert.alert("Error", error.response?.data?.error || "Failed to create tag"); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateTagData> }) => tagsAPI.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tags"] }); closeModal(); },
        onError: (error: any) => { Alert.alert("Error", error.response?.data?.error || "Failed to update tag"); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tagsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
        onError: () => { Alert.alert("Error", "Failed to delete tag"); },
    });

    const openCreateModal = () => { setEditingTag(null); setName(""); setColor(TAG_COLORS[0]); setModalVisible(true); };
    const openEditModal = (tag: Tag) => { setEditingTag(tag); setName(tag.name); setColor(tag.color); setModalVisible(true); };
    const closeModal = () => { setModalVisible(false); setEditingTag(null); setName(""); setColor(TAG_COLORS[0]); };

    const handleSubmit = () => {
        if (!name.trim()) { Alert.alert("Error", "Please enter a tag name"); return; }
        if (editingTag) {
            updateMutation.mutate({ id: editingTag.id, data: { name: name.trim(), color } });
        } else {
            createMutation.mutate({ name: name.trim(), color });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <View className="px-5 pt-3 pb-2">
                <TouchableOpacity onPress={openCreateModal} className="bg-primary rounded-xl py-3.5 items-center flex-row justify-center" activeOpacity={0.8}>
                    <Text className="text-white text-lg mr-2">+</Text>
                    <Text className="text-white font-semibold">Create New Tag</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={isDark ? "#ff6666" : "#ff3333"} />
                </View>
            ) : (
                <FlatList
                    data={tags || []}
                    renderItem={({ item }) => <TagCard tag={item} onEdit={openEditModal} onDelete={(id) => deleteMutation.mutate(id)} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={isDark ? "#ff6666" : "#ff3333"} />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-3xl mb-2">🏷️</Text>
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm text-center">
                                No tags yet.{"\n"}Create tags to organize your transactions!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
                <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <View className="bg-white dark:bg-neutral-700 rounded-t-3xl p-6 pb-10">
                        <View className="items-center mb-4">
                            <View className="w-10 h-1 bg-neutral-200 dark:bg-neutral-600 rounded-full" />
                        </View>
                        <Text className="text-black dark:text-white text-lg font-bold mb-6">
                            {editingTag ? "Edit Tag" : "Create Tag"}
                        </Text>

                        <View className="mb-4">
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-2">Tag Name</Text>
                            <TextInput
                                className="bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 rounded-xl px-4 py-3.5 text-black dark:text-white text-base"
                                placeholder="e.g., Food, Transport, Salary"
                                placeholderTextColor={isDark ? "#666666" : "#999999"}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-3">Color</Text>
                            <View className="flex-row flex-wrap">
                                {TAG_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setColor(c)}
                                        className={`w-10 h-10 rounded-xl m-1 items-center justify-center ${color === c ? "border-2 border-black dark:border-white" : ""}`}
                                        style={{ backgroundColor: c }}
                                        activeOpacity={0.7}
                                    >
                                        {color === c && <Text className="text-white text-xs">✓</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View className="bg-neutral-100 dark:bg-neutral-600 rounded-xl p-3 mb-6 flex-row items-center">
                            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                            <Text className="text-black dark:text-white text-sm">{name || "Tag Preview"}</Text>
                        </View>

                        <View className="flex-row">
                            <TouchableOpacity onPress={closeModal} className="flex-1 bg-neutral-100 dark:bg-neutral-600 rounded-xl py-3.5 items-center mr-2" activeOpacity={0.8}>
                                <Text className="text-neutral-500 dark:text-neutral-400 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isPending}
                                className={`flex-1 rounded-xl py-3.5 items-center ml-2 ${isPending ? "bg-primary/50" : "bg-primary"}`}
                                activeOpacity={0.8}
                            >
                                {isPending ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text className="text-white font-semibold">{editingTag ? "Update" : "Create"}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
