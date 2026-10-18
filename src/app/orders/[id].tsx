import { RequireRole } from '../../components/RequireRole';
import { OrderDetailScreen } from '../../screens/Orders';
export default function Order() { return <RequireRole roles={['customer', 'staff', 'admin', 'driver']}><OrderDetailScreen /></RequireRole>; }
