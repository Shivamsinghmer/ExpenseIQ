import React, { useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput, Modal,
    ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { tagsAPI, type Tag, type CreateTagData } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tags as TagsIcon, Pencil, Trash2, X, Plus, Check } from "lucide-react-native";

const TAG_COLORS = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
    "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
    "#06B6D4", "#84CC16",
];

export default function Tags() {
    const queryClient = useQueryClient();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
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
        <View className="flex-1 bg-background dark:bg-background-dark">
            {/* Header Section */}
            <View
                className="bg-transparent pb-6 px-6 rounded-b-[20px] mb-6"
                style={{ paddingTop: insets.top + 20 }}
            >
                <Text className="text-black dark:text-white text-3xl font-bold tracking-tight mb-2">Tags</Text>
                <Text className="text-black/60 dark:text-white/60 text-md font-medium">Manage your transaction categories</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#000000" />
                </View>
            ) : (
                <FlatList
                    data={tags || []}
                    renderItem={({ item }) => (
                        <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-3 mx-5 flex-row items-center shadow-sm">
                            <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: item.color + "20" }}>
                                <View className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-bold text-base">{item.name}</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                                    {item._count?.transactions || 0} transactions
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity onPress={() => openEditModal(item)} className="bg-slate-100 dark:bg-slate-700 rounded-full p-2.5">
                                    <Pencil size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert.alert("Delete Tag", `Are you sure you want to delete "${item.name}"?`, [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                                        ]);
                                    }}
                                    className="bg-red-50 dark:bg-red-900/20 rounded-full p-2.5"
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000000" />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 opacity-50">
                            <TagsIcon size={30} color="gray" />
                            <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium text-center mt-2">
                                No tags yet.{"\n"}Create tags to organize your transactions!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={openCreateModal}
                className="absolute bottom-28 right-6 bg-black w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/30"
                activeOpacity={0.9}
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>

            {/* Tag Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
                <View className="flex-1 justify-center items-center bg-black/50 px-6">
                    <View className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: color + "20" }}>
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                                </View>
                                <Text className="text-xl font-bold text-slate-800 dark:text-white">
                                    {editingTag ? "Edit Tag" : "New Tag"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} className="bg-slate-100 dark:bg-slate-700 rounded-full p-2">
                                <X size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                            </TouchableOpacity>
                        </View>

                        {/* Name Input */}
                        <View className="mb-5">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Name</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white text-base font-semibold"
                                placeholder="e.g. Groceries"
                                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                                value={name}
                                onChangeText={setName}
                                autoFocus
                            />
                        </View>

                        {/* Color Picker */}
                        <View className="mb-6">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 ml-1">Color</Text>
                            <View className="flex-row flex-wrap gap-2 justify-center">
                                {TAG_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setColor(c)}
                                        className="w-11 h-11 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: c,
                                            borderWidth: color === c ? 3 : 0,
                                            borderColor: isDark ? "#e2e8f0" : "#1e293b",
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {color === c && <Check size={18} color="white" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isPending || !name.trim()}
                            className={`w-full py-4 rounded-xl items-center ${isPending || !name.trim() ? "bg-slate-200 dark:bg-slate-700" : "bg-black"}`}
                            activeOpacity={0.9}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className={`font-bold text-base ${isPending || !name.trim() ? "text-slate-400 dark:text-slate-500" : "text-white"}`}>
                                    {editingTag ? "Save Changes" : "Create Tag"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
