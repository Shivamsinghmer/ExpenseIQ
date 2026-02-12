import { View, ActivityIndicator } from "react-native";

export default function Page() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
            <ActivityIndicator size="large" color="#000" />
        </View>
    );
}
