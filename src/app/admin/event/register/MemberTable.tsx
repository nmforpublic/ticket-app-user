import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "./validation";

interface MemberTableProps {
  form: UseFormReturn<EventFormValues>;
}

export default function MemberTable({ form }: MemberTableProps) {
  const members = form.watch("members") || [];
  const selectedMembers = members.filter(member => member.isSelected);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>ユーザー</TableHead>
            <TableHead className="text-right">ゲスト招待枠</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    className="rounded-full"
                    src={member.image}
                    width={40}
                    height={40}
                    alt={member.name}
                  />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <span className="text-muted-foreground mt-0.5 text-xs">{member.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">{member.guestLimit}</TableCell>
            </TableRow>
          ))}
          {selectedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                運営者が選択されていません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
