import { RequireRole } from '../../../components/RequireRole';
import { OrderDetailScreen } from '../../../screens/Orders';
export default function WholesaleOrder() { return <RequireRole roles={['customer', 'wholesale', 'staff', 'admin']}><OrderDetailScreen wholesale /></RequireRole>; }
