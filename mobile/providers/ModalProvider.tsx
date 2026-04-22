import React, { createContext, useContext, useState, useCallback } from "react";
import { AppModal } from "../components/AppModal";

interface ModalButton {
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
}

interface ModalConfig {
    visible: boolean;
    title: string;
    message: string;
    buttons: ModalButton[];
}

interface ModalContextType {
    showModal: (title: string, message: string, buttons?: ModalButton[]) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<ModalConfig>({
        visible: false,
        title: "",
        message: "",
        buttons: []
    });

    const hideModal = useCallback(() => {
        setConfig(prev => ({ ...prev, visible: false }));
    }, []);

    const showModal = useCallback((title: string, message: string, buttons?: ModalButton[]) => {
        const defaultButtons: ModalButton[] = [
            { text: "OK", onPress: hideModal }
        ];
        
        setConfig({
            visible: true,
            title,
            message,
            buttons: buttons || defaultButtons
        });
    }, [hideModal]);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <ModalRenderer config={config} onClose={hideModal} />
        </ModalContext.Provider>
    );
};

const ModalRenderer = React.memo(({ config, onClose }: { config: ModalConfig, onClose: () => void }) => {
    return (
        <AppModal
            visible={config.visible}
            title={config.title}
            message={config.message}
            buttons={config.buttons}
            onClose={onClose}
        />
    );
});

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
