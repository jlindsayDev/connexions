import { createRoute } from "honox/factory";
import { Calendar } from "../islands/Calendar";

export const GET = createRoute((c) => {
    return c.render(<Calendar />);
});

export default GET;
