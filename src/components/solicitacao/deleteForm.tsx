import { Solicitacao } from "./types";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface DeletarDialogProps {
    solicitacao: Solicitacao;
    onDelete: (id: number) => void;
}

export function DeletarDialog({ solicitacao, onDelete }: DeletarDialogProps) {
    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/solicitacao/${id.toString()}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            onDelete(id);
            toast.success("Solicitação deletada.");
        } catch {
            toast.error("Erro ao deletar solicitação.");
        }
    };

    return (
        <Dialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger
                        className="p-2 rounded-md hover:bg-gray-700/50 transition-colors flex items-center justify-center"
                        aria-label="Deletar solicitação"
                    >
                        <Trash2 className="h-5 w-5 text-red-400" />
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-sm">
                    Deletar
                </TooltipContent>
            </Tooltip>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar exclusão</DialogTitle>
                    <DialogDescription>Deseja realmente deletar esta solicitação?</DialogDescription>
                    <p className="text-sm text-gray-500">Assunto: {solicitacao.assunto}</p>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">
                            <X />
                            Fechar
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={() => handleDelete(solicitacao.id)}>
                        <Trash2 className="h-4 w-4" /> Deletar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}