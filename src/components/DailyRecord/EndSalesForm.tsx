import { DateTime } from "luxon";
import { ExpenseTable } from "../Sales/ExpenseTable.component";
import { SalesTable } from "../Sales/SalesTable.component";
import { Button } from "@nextui-org/button";
import { Input, useDisclosure } from "@nextui-org/react";
import { NewExpenseModal } from "src/components/Expense/NewExpenseModal";
import { ExpenseApiClient } from "src/libs/client/api/expense";
import { useEffect, useState } from "react";
import { formatNumberToCurrency } from "src/libs/utils/currency";
import { DailyRecordClient } from "src/libs/client/api/dailyrecord";
import { useAuthStore } from "src/libs/client/store/auth.store";

export function EndSalesForm(props: { start: DateTime, end: DateTime, shouldClose:boolean, callback:()=>void }) {
    const authStore = useAuthStore(state=>state);
    const { onOpen: onNewExpenseOpen, onClose: onNewExpenseClose, isOpen: isNewExpenseOpen } = useDisclosure();
    const [expenseEnd, setExpenseEnd] = useState(props.end); // use this as hack to trigger re-renders in expense table. delegate to zustand later TODO
    const [totalSales, setTotalSales] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);

    //Cash
    const [actualCashBalance, setActCashBal] = useState("0");
    const [toCashLodge, setToCashLodge] = useState("0");
    const [toCashDrawer, setToCashDrawer] = useState("0");

    // Submit
    const [isSubmitting,setIsSubmitting] = useState(false);

    const onNewExpenseSuccess = () => {
        onNewExpenseClose();
        setExpenseEnd(DateTime.now())
    }

    const handleEndSalesClick = async () => {
        const date = DateTime.now().startOf("day").toJSDate();
        const dr = await DailyRecordClient.getDailyRecord(date);
        if(dr) {
            setIsSubmitting(true);
            try {
                await DailyRecordClient.closeDailyRecor({
                    id: dr.id,
                    actualCashBalance: +actualCashBalance,
                    endingTime: new Date(),
                    toCashDrawer: +toCashDrawer,
                    toCashLodge: +toCashLodge,
                    totalExpenses,
                    totalSales,
                    closedBy: authStore.userId!
                });
                props.callback()
            } catch (error) {
                
            } finally {
                setIsSubmitting(false);
            }
        }
    }

    useEffect(()=>{
        if(props.shouldClose){
            handleEndSalesClick();
        }
    },[props.shouldClose])

    return (
        <>
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                    <div className="flex flex-col w-1/3 gap-2">
                        <h3>Sales</h3>
                        <SalesTable
                            start={props.start.startOf('day')}
                            end={props.end.endOf('day')}
                            totalCallback={setTotalSales}
                        />
                    </div>
                    <div className="flex flex-col w-2/3 gap-2">
                        <div className="flex items-center gap-4">
                            <h3>Expenses</h3>
                            <Button onClick={onNewExpenseOpen} color="primary" size="sm">New Expense</Button>
                        </div>
                        <ExpenseTable
                            start={props.start}
                            end={expenseEnd}
                            totalCallback={setTotalExpenses}
                        />
                    </div>
                </div>
                <div>
                    <strong>Summary</strong>
                    <div className="flex flex-row gap-1">
                        <div className="flex w-1/3 flex-col gap-2">
                            <p>After Expenses: {formatNumberToCurrency(totalSales - totalExpenses)}</p>
                        </div>
                        <div className="flex flex-row gap-1 w-1/3 flex-wrap">
                            {/* <p>Calculated Cash Balance: {}</p> */}
                            <Input
                                value={actualCashBalance}
                                onChange={e => setActCashBal(e.target.value)}
                                size="sm"
                                label="Actual Cash Balance"
                                type="number" />
                            <Input
                                value={toCashLodge}
                                onChange={e => setToCashLodge(e.target.value)}
                                size="sm" label="To Cash Lodge" type="number" />
                            <Input
                                value={toCashDrawer}
                                onChange={e => setToCashDrawer(e.target.value)}
                                size="sm" label="To Cash Drawer" type="number" />
                        </div>
                    </div>
                </div>
            </div>
            <NewExpenseModal onSuccess={onNewExpenseSuccess} isOpen={isNewExpenseOpen} onClose={onNewExpenseClose} />
        </>
    )
}